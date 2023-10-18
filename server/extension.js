

const debug = (text)=>
{
  //console.log(text)
}

const extensionHooks = {


  'pre_request_execute': function(ctx, ...args)
  {
    debug('pre_request_execute')

  }
  ,
  'post_request_execute': function(ctx, ...args)
  {
    debug('post_request_execute')
  }
  ,
  'job_started': function(ctx, ...args)
  {
    debug('job_started')
  }
  ,
  'job_finished': function(ctx, ...args)
  {
    debug('job_finished')
  }

}

import resolveScript from '../scripts/server/resolve.js'


const extensionMethods = {
  'resolveMissingBlock': async (ctx, blockKey) => {
      //strip 'run.' prefix from blockKey
      blockKey = blockKey.replace('run.', '')
      const result = await resolveScript.exec(ctx, [blockKey])
      return result?.block || undefined
  }
 }




let macros = {

"omni-core-replicate:replicate_exec": async (payload, ctx, component) => {
  if (payload.enabled === false)
  {
    return {}
  }
  for (let key in payload) {
    if (payload[key] === '' || payload[key] === undefined) {
      delete payload[key];
    }

    // This is needed for now as the select control does not handle numbers correctly
    if (component.inputs[key].type === 'integer')
    {
      payload[key] = parseInt(payload[key]);
    }
    else if (['number','float'].includes(component.inputs[key].type))
    {
      payload[key] = parseFloat(payload[key]);
    }
  }
  payload._replicate = JSON.parse(
    JSON.stringify(component.custom.replicate)
  );
  return await ctx.app.api2.execute(
    `${component.name}`,
    payload,
    { responseContentType: component.data.responseContentType },
    { user: ctx.userId }
  );
  }

}


const createComponents =  () => ({
  blocks: [],
  patches: [],
  macros: macros,

})

export default
{
  extensionHooks,
  extensionMethods,
  createComponents
}
