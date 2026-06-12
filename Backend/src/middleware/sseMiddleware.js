// this middleware sets the SSE response headers

export function initSSE(req, res){
    res.set({
        "content-Type": 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // this disables nginx proxy buffering
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:5173'
    });
    res.flushHeaders()
    res.sendEvent = (data)=>{
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        if(typeof res.flush === 'function') res.flush();
    };
    // handle the client disconnect
    const cleanup = ()=>{
        if(!res.writableEnded) res.end();
    };
    req.on('close', cleanup)
    req.on('aborted', cleanup)
}