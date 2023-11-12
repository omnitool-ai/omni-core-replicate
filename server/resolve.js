/**
 * Copyright (c) 2023 MERCENARIES.AI PTE. LTD.
 * All rights reserved.
 */

const script = {
  name: 'resolve',

  exec: async function (ctx, payload) {
    try {
      return await this._exec(ctx, payload);
    } catch (e) {
      if (FallbackModels[payload[0]] === undefined) {
        throw e;
      } else {
        omnilog.warn(`resolveMissingBlock failed. Attempt recovery with static fallback for ${payload[0]}`);
        return await this._fallback(ctx, payload, FallbackModels);
      }
    }
  },
  _fallback: async function (ctx, payload, fallbackModels) {
    if (payload.length < 1) {
      return { success: false };
    }
    const [model_owner, model_name] = payload[0].split('/');

    if (!model_name || !model_owner) {
      return { success: false };
    }
    const fallbackBlock = fallbackModels[payload[0]];
    // create a new block instance
    const namespaceName = 'omni-core-replicate:run';
    const componentName = model_owner + '/' + model_name;
    // add the block to the block manager
    ctx.app.blocks.blocks.set(`${fallbackBlock.apiNamespace}.${fallbackBlock.apiOperationId}`, fallbackBlock);
    const newBlock = await ctx.app.blocks.getInstance(`${namespaceName}.${componentName}`, ctx.userId);
    omnilog.status_success(`[Replicate] Resolved ${componentName} with static fallback`);
    return {
      replicateResult: {},
      block: newBlock,
      json: JSON.stringify(fallbackBlock)
    };
  },
  _exec: async function (ctx, payload) {
    if (payload.length < 1) {
      return { success: false };
    }
    const [model_owner, model_name] = payload[0].split('/');

    if (!model_name || !model_owner) {
      return { success: false };
    }

    const result = await ctx.app.blocks.runBlock(ctx, 'replicate.models_get', {
      model_owner,
      model_name
    });
    const replicateModel = result._omni_result;

    let source = {
      links: {}
    };

    if (replicateModel.github_url) source.links.Code = replicateModel.github_url;
    if (replicateModel.paper_url) source.links.Paper = replicateModel.paper_url;
    if (replicateModel.license_url) source.links.License = replicateModel.license_url;

    const latest_version = replicateModel.latest_version;
    const raw_schema = latest_version.openapi_schema;

    const nsData = ctx.app.blocks.namespaces.get('replicate');
    const adapter = new ctx.app.blocks.ReteAdapter('omni_core_replicate:replicate', raw_schema, nsData);
    let schema = raw_schema;
    const components = schema.components;

    const namespaceName = 'omni-core-replicate:run';
    const componentName = replicateModel.owner + '/' + replicateModel.name; /*'_' + latest_version.id*/
    const component = ctx.app.blocks.BaseComponent.create(namespaceName, componentName)
      .fromScratch()
      .set('description', replicateModel.description)
      .set('title', `Replicate: ${replicateModel.owner}/${replicateModel.name}`)
      //.set('category', 'Security')
      .setMeta({
        source
      })
      .setMethod('X-CUSTOM');

    const inputs = components.schemas.Input;
    const output = adapter.resolveSchema(components.schemas.Output);
    component.setCustom('replicate', {
      owner: replicateModel.owner,
      model: replicateModel.name,
      version: latest_version.id
    });

    for (let key in inputs.properties) {
      let rawSchema = inputs.properties[key];

      // Recursively resolve any $ref in the schema
      let input = Object.assign({}, rawSchema, adapter.resolveSchema(inputs.properties[key]));

      // Suboptimal handling of allOf by taking the first element. This can be improved later
      if (input.allOf && input.allOf.length > 0) {
        input.type = input.allOf[0].type;
        if (input.allOf[0].enum) {
          input.type ??= typeof input.allOf[0].enum[0];
          input.choices = input.allOf[0].enum.map((e) => {
            return { value: e.toString(), title: e.toString() };
          });
        }
        input.title = input.allOf[0].title;
      } else if (input.anyOf && input.anyOf.length > 0) {
        input.type = input.anyOf[0].type;
        if (input.anyOf[0].enum) {
          input.type ??= typeof input.anyOf[0].enum[0];
          input.choices = input.anyOf[0].enum.map((e) => {
            return { value: e.toString(), title: e.toString() };
          });
        }
        input.title = input.anyOf[0].title;
      }

      // enums are represented as choices
      if (input.enum) {
        input.choices = input.enum;
      }

      let customSocket = undefined;
      let customSocketOptions = {};

      // If we have a choices option, which results in a select control, we should provide steps

      if (input.type === 'string') {
        input.customSocket = 'text';
      }

      if (input.format === 'uri') {
        customSocketOptions.format = 'base64-withHeader';
        if (
          input.description?.includes('image') ||
          key === 'image' ||
          input.title === 'Image' ||
          key === 'mask' ||
          input.title === 'Mask'
        ) {
          customSocket = 'image';
        } else {
          input.type = 'object';
          customSocket = 'file';
        }
      }

      if (input.minimum != null || input.maximum != null) {
        if (input.type === 'number' || input.type === 'float') {
          input.step = 0.01;
        } else if (input.type === 'integer') {
          input.step = 1;
        }
      }

      let defaultV = (replicateModel.default_example?.input?.[key] || input.default) ?? input.default;

      const ip = component
        .createInput(key, input.type, customSocket, customSocketOptions)
        .set('description', input.description)
        .setDefault(defaultV)
        .setConstraints(input.minimum, input.maximum, input.step)
        .set('title', input.title)
        .setRequired(inputs.required?.includes?.(key));

      if (input.choices?.length) {
        ip.setChoices(input.choices, defaultV);
      }

      component.addInput(ip.toOmniIO());

      const enabledInput = component
        .createInput('enabled', 'boolean')
        .set('title', 'Enabled')
        .set('description', 'Programmatically toggle this component')
        .setDefault(true);
      component.addInput(enabledInput.toOmniIO());
    }

    let customSocketOptions = {
      customSettings: {}
    };

    if (output.type == 'array') {
      output.type = output.items.type;
      output.format = output.items.format;
      customSocketOptions.array = true;

      if (output.items.type === 'string') {
        output.type = 'string';
        output.customSocket = 'text';
      } else if (output.items.anyOf) {
        output.type = output.items.anyOf[0].type;
      } else {
        output.type = output.items?.type;
      }

      if (output['x-cog-array-display'] === 'concatenate') {
        customSocketOptions.array = false;
        customSocketOptions.customSettings.array_separator = '';
        customSocketOptions.customSettings.filter_empty = true;
      }
    }

    if (output.format === 'uri') {
      customSocketOptions.array = true;
      if (output.description?.includes('image') || output.title === 'Image' || output.title === 'Mask') {
        output.type = 'array';
        output.customSocket = 'image';
      } else {
        output.type = 'array';
        //output.title = 'File';
        output.customSocket = 'file';
      }
    }

    if (!output.type) {
      output.type = 'object';
      console.warn('Unknown output type', output);
    } 
    // else {
    //   console.warn(output.type);
    // }

    component.addOutput(
      component
        .createOutput('output', output.type, output.customSocket, customSocketOptions)
        .set('description', output.description)
        .set('title', output.title)
        .toOmniIO()
    );

    component.setMacro('exec', 'omni-core-replicate:replicate_exec');

    // add the block to the block manager
    ctx.app.blocks.addBlock(component.toJSON());
    // create a new block instance
    const newBlock = await ctx.app.blocks.getInstance(`${namespaceName}.${componentName}`, ctx.userId);

    return {
      replicateResult: result,
      block: newBlock,
      json: component.toJSON()
    };
  }
};
export default script;
