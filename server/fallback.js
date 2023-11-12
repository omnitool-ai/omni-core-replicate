const FallbackModels = 
{
  "lucataco/faceswap": {"type":"OAIComponent31","flags":0,"macros":{"exec":"omni-core-replicate:replicate_exec"},"origin":"omnitool:Composer","customData":{"replicate":{"owner":"lucataco","model":"faceswap","version":"9a4298548422074c3f57258c5d544497314ae4112df80d116f0d2109e843d20d"}},"displayNamespace":"omni-core-replicate:run","displayOperationId":"lucataco/faceswap","apiNamespace":"omni-core-replicate:run","apiOperationId":"lucataco/faceswap","responseContentType":"application/json","category":"Utilities","tags":["default"],"description":"Faceswap with face enhancer","title":"Replicate: lucataco/faceswap","meta":{"source":{"links":{"Code":"https://github.com/lucataco/cog-faceswap"}}},"method":"X-CUSTOM","inputs":{"swap_image":{"name":"swap_image","customSocket":"image","socketOpts":{"format":"base64-withHeader"},"type":"string","dataTypes":["string"],"customData":{},"title":"Swap Image","source":{"sourceType":"requestBody"},"description":"Swap/source image","default":"https://replicate.delivery/pbxt/JN97ny6RmjfrxizbgyHnPGGP8Kxzw6UI20ekarOg7dbo02Pi/elon.jpg","required":true},"enabled":{"name":"enabled","socketOpts":{},"type":"boolean","dataTypes":["boolean"],"customData":{},"title":"Enabled","source":{"sourceType":"requestBody"},"description":"Programmatically toggle this component","default":true},"target_image":{"name":"target_image","customSocket":"image","socketOpts":{"format":"base64-withHeader"},"type":"string","dataTypes":["string"],"customData":{},"title":"Target Image","source":{"sourceType":"requestBody"},"description":"Target/base image","default":"https://replicate.delivery/pbxt/JN97nntkJiijxKQ4iY8JUvVmy9PwY3VETJjBVUczrIqr2pwP/tony.jpg","required":true}},"outputs":{"output":{"name":"output","customSocket":"file","socketOpts":{"customSettings":{},"array":true},"type":"object","dataTypes":["object"],"customData":{},"title":"Output","source":{"sourceType":"responseBody"}}},"hash":"3864526c"}
}

export default FallbackModels;