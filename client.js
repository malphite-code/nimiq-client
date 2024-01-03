const DEFAULT_OPTIONS = {
  miningPool: { host: 'pool.nimiq.watch', port: '8443' },
  address: 'NQ08 SUEH T0GS PCDJ HUNX Q50H B0M0 ABHA PP03',
  threads: 4
}

class Client {
  // Nimiq miner internal
  miner = null
  network = null
  consensus = null
  blockchain = null
  account = null
  availableThreads = navigator.hardwareConcurrency || 4

  // Options
  miningPool = { host: 'pool.nimiq.watch', port: '8443' }
  address = null
  threads = null

  // Internal state
  loaded = false;
  status = 'connecting';

  // Events
  events = {
    start: [],
    stop: [],
    change: [],
    error: []
  };

  /**
   * NimiqMiner constructor
   * @param {*} options 
   */
  constructor(options = DEFAULT_OPTIONS) {
    const opts = {...DEFAULT_OPTIONS, ...options};

    if (!this.hasWASMSupport()) {
      throw new Error('Your browser is not supported WASN.')
    }

    this.address = opts.address;
    this.miningPool = opts.miningPool;

    // init threads
    if (opts.threads > this.availableThreads) {
      this.threads = this.availableThreads;
    } else {
      this.threads = opts.threads || this.availableThreads / 2;
    } 
  }

  /**
   * Load nimiq client sdk
   * @returns 
   */
  loadNimiq() {
    return new Promise((resolve, reject) => {
      if (window.Nimiq) {
        resolve();
        return;
      }

      let script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://cdn.nimiq.com/nimiq.js';
      script.addEventListener('load', () => {
        if (window.Nimiq) {
          resolve(script)
        } else {
          reject(script)
        }
      }, false);
      script.addEventListener('error', () => reject(script), false);
      document.body.appendChild(script);
    });
  }

  /**
   * Start mining
   * @returns 
   */
  async start() {
    try {
      await this.loadNimiq()
    } catch (error) {
      // console.error(error.message);
      return;
    }

    this.loaded = true;

    if (!this.consensus) {
      this.status = 'connecting'

      Nimiq.init(this.createMiner.bind(this))

      return;
    }

    this.work()
  }

  /**
   * Init network and create miner
   */
  async createMiner() {
    Nimiq.GenesisConfig.main()

    const consensus = await Nimiq.Consensus.nano()

    this.consensus = consensus
    this.network = consensus.network
    this.blockchain = consensus.blockchain
    this.account = Nimiq.Address.fromUserFriendlyAddress(this.address)

    const deviceId = Nimiq.BasePoolMiner.generateDeviceId(this.network.config)
    this.miner = new Nimiq.NanoPoolMiner(this.blockchain, this.network.time, this.account, deviceId)
    this.miner.threads = this.threads

    this.consensus.on('established', this.onConsensusEstablished.bind(this))
    this.consensus.on('lost', this.onConsensusLost.bind(this))

    this.miner.on('start', this.onMinerStarted.bind(this))
    this.miner.on('connection-state', this.onMinerConnectionState.bind(this))
    this.miner.on('hashrate-changed', this.onHashRateChanged.bind(this))
    this.miner.on('stop', this.onMinerStopped.bind(this))

    this.status = 'connecting'
    this.network.connect()
  }

  /**
   * Start work
   */
  work() {
    if (!this.miner.working && this.loaded) {
      this.miner.startWork()
    }
  }

  /**
   * Event when consensus established
   */
  onConsensusEstablished() {
    const { host, port } = this.miningPool
    this.miner.connect(host, port)
    this.work()
  }

  /**
   * Event when connect lost
   */
  onConsensusLost() {
    this.fireEvent('error', this.hashrate);
  }

  /**
   * Event when network connection change
   */
  onMinerConnectionState() {
    this.work()
  }

  /**
   * Event hashrate change
   */
  onHashRateChanged() {
    const hashrate = this.miner.hashrate;
    this.hashrate = hashrate;
  
    this.fireEvent('change', [hashrate]);
  }

  /**
   * Event when miner is started
   */
  onMinerStarted() {
    this.isMining = true
    this.hashrate = this.miner.hashrate;

    this.fireEvent('start');
    this.fireEvent('change', [this.hashrate]);
  }

  /**
   * Event when miner is stoped
   */
  onMinerStopped() {
    if (!this.shouldWork) {
      this.isMining = false
      this.status = 'paused'
    }

    this.work()
    this.fireEvent('stop');
  }

  /**
   * Update miner threads
   * @param {*} value 
   */
  updateThreads(value) {
    const threads = value > this.availableThreads ? this.availableThreads : value;

    this.miner.threads = threads;
    this.threads = threads;
  }

  /**
   * Check browser support WASM
   * @returns 
   */
  hasWASMSupport() {
    return typeof WebAssembly !== 'undefined';
  }

  /**
   * Register external events
   * @param {*} name 
   * @param {*} callback 
   */
  on(name, callback) {
    if (!callback || typeof callback !== 'function') {
      throw new Error('Callback is not a function.')
    }

    const events = this.events[name] ?? null;
    if (events) {
      this.events[name] = [...events, callback];
    }
  }

  /**
   * Remove external events
   * @param {*} name 
   */
  off(name) {
    if(this.events[name]) {
      this.events[name] = [];
    }
  }

  /**
   * Fire event base name
   * @param {*} name 
   * @param {*} options 
   */
  fireEvent(name, options = null) {
    const handlers = this.events[name] ?? [];
    handlers.forEach(callback => {
      if (options) {
        callback.call(this, ...options)
      } else {
        callback.call(this)
      }
    }) 
  }
}

window.Client = Client;