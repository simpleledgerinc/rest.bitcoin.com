let express = require('express');
let router = express.Router();
let axios = require('axios');

let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let BitboxHTTP = axios.create({
  baseURL: `http://138.68.54.100:8332/`
});
let username = 'bitcoin';
let password = 'xhFjluMJMyOXcYvF';

router.get('/', (req, res, next) => {
  res.json({ status: 'network' });
});

// router.post('/addNode/:node/:command', (req, res, next) => {
//   BITBOX.Network.addNode(req.params.node, req.params.command)
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//     });
// });
//
// router.post('/clearBanned', (req, res, next) => {
//   BITBOX.Network.clearBanned()
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//   });
// });
//
// router.post('/disconnectNode/:address/:nodeid', (req, res, next) => {
//   BITBOX.Network.disconnectNode(req.params.address, req.params.nodeid)
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//   });
// });
//
// router.get('/getAddedNodeInfo/:node', (req, res, next) => {
//   BITBOX.Network.getAddedNodeInfo(req.params.node)
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//   });
// });

router.get('/getConnectionCount', (req, res, next) => {
  BitboxHTTP({
    method: 'post',
    auth: {
      username: username,
      password: password
    },
    data: {
      jsonrpc: "1.0",
      id:"getconnectioncount",
      method: "getconnectioncount"
    }
  })
  .then((response) => {
    res.send(response.data.result);
  })
  .catch((error) => {
    res.send(error.response.data.error.message);
  });
});

router.get('/getNetTotals', (req, res, next) => {
  BitboxHTTP({
    method: 'post',
    auth: {
      username: username,
      password: password
    },
    data: {
      jsonrpc: "1.0",
      id:"getnettotals",
      method: "getnettotals"
    }
  })
  .then((response) => {
    res.json(response.data.result);
  })
  .catch((error) => {
    res.send(error.response.data.error.message);
  });
});

router.get('/getNetworkInfo', (req, res, next) => {
  BitboxHTTP({
    method: 'post',
    auth: {
      username: username,
      password: password
    },
    data: {
      jsonrpc: "1.0",
      id:"getnetworkinfo",
      method: "getnetworkinfo"
    }
  })
  .then((response) => {
    res.json(response.data.result);
  })
  .catch((error) => {
    res.send(error.response.data.error.message);
  });
});

router.get('/getPeerInfo', (req, res, next) => {
  BitboxHTTP({
    method: 'post',
    auth: {
      username: username,
      password: password
    },
    data: {
      jsonrpc: "1.0",
      id:"getpeerinfo",
      method: "getpeerinfo"
    }
  })
  .then((response) => {
    res.json(response.data.result);
  })
  .catch((error) => {
    res.send(error.response.data.error.message);
  });
});

router.get('/ping', (req, res, next) => {
  BitboxHTTP({
    method: 'post',
    auth: {
      username: username,
      password: password
    },
    data: {
      jsonrpc: "1.0",
      id:"ping",
      method: "ping"
    }
  })
  .then((response) => {
    res.json(JSON.stringify(response.data.result));
  })
  .catch((error) => {
    res.send(error.response.data.error.message);
  });
});
//
// router.post('/setBan/:subnet/:command', (req, res, next) => {
//   // TODO finish this
//   BITBOX.Network.getConnectionCount(req.params.subnet, req.params.command)
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//   });
// });
//
// router.post('/setNetworkActive/:state', (req, res, next) => {
//   let state = true;
//   if(req.params.state  && req.params.state === 'false') {
//     state = false;
//   }
//   BITBOX.Network.getConnectionCount(state)
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//   });
// });

module.exports = router;
