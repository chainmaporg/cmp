/**
 * Created by godong on 2016. 3. 9..
 */

/**
 * Require modules
 */
var _ = require('underscore'),
  request = require('request'),
  logger =  require('log4js').getLogger('sole-node'),
  QueryString = require('querystring'),
  Query = require('./query');

/**
 * Solr Node Client
 *
 * @constructor
 *
 * @param {Object} options
 * @param {String} [options.host] - host address of Solr server
 * @param {Number|String} [options.port] - port number of Solr server
 * @param {String} [options.core] - client core name
 * @param {String} [options.rootPath] - solr root path
 * @param {String} [options.protocol] - request protocol ('http'|'https')
 * @param {String} [options.debugLevel] - log4js debug level ('ALL'|'DEBUG'|'INFO'|'ERROR'|...)
 */
function Client(options) {
  this.options = {
    host: options.host || '127.0.0.1',
    port: options.port || '8983',
    core: options.core || '',
    rootPath: options.rootPath || 'solr',
    protocol: options.protocol || 'http'
  };

  if (options.debugLevel) {
    logger.setLevel(options.debugLevel);
  }

  // Path Constants List
  this.SEARCH_PATH = 'select';
  this.TERMS_PATH = 'terms';
  this.SPELL_PATH = 'spell';
  this.MLT_PATH = 'mlt';
  this.UPDATE_PATH = 'update';
  this.PING_PATH = 'admin/ping';
}

/**
 * Make host url
 * @private
 *
 * @param {String} protocol - protocol ('http'|'https')
 * @param {String} host - host address
 * @param {String|Number} port - port number
 *
 * @returns {String}
 */
Client.prototype._makeHostUrl = function(protocol, host, port) {
  if (port) {
    return protocol + '://' + host + ':' + port;
  } else {
    return protocol + '://' + host;
  }
};

/**
 * Request get
 *
 * @param {String} path - target path
 * @param {Object|String} query - query
 * @param {Function} finalCallback - (err, result)
 */
Client.prototype._requestGet = function(path, query, finalCallback) {
  var params, options, requestPrefixUrl, requestFullPath;

  if (query instanceof Query) {
    params = query.toString();
  } else if (_.isString(query)) {
    params = query;
  } else {
    params = 'q=*:*';
  }
  requestPrefixUrl = this._makeHostUrl(this.options.protocol, this.options.host, this.options.port);
  requestPrefixUrl += '/' + [this.options.rootPath, this.options.core, path].join('/');

  requestFullPath = requestPrefixUrl + '?' + params;

  logger.debug('[_requestGet] requestFullPath: ', requestFullPath);

  options = {
    method: 'GET',
    url: requestFullPath,
    headers: {
      'accept' : 'application/json; charset=utf-8'
    }
  };
  request(options, function (err, res, body) {
    var result;
    /* istanbul ignore next */
    if (err) {
      return finalCallback(err);
    }
    if (res.statusCode !== 200) {
      logger.error(body);
      return finalCallback('Solr server error: ' + res.statusCode);
    }
    /* istanbul ignore next */
    try {
      result = JSON.parse(body);
      return finalCallback(null, result);
    } catch(e) {
      return finalCallback(null, body);
    }
  });
};

/**
 * Request post
 *
 * @param {String} path - target path
 * @param {Object} data - json data
 * @param {Object|String} urlOptions - url options
 * @param {Function} finalCallback - (err, result)
 */
Client.prototype._requestPost = function(path, data, urlOptions, finalCallback) {
  var params, options, requestPrefixUrl, requestFullPath;

  if (_.isString(urlOptions)) {
    params = urlOptions;
  } else if (_.isObject(urlOptions)) {
    params = QueryString.stringify(urlOptions);
  } else {
    params = '';
  }

  requestPrefixUrl = this._makeHostUrl(this.options.protocol, this.options.host, this.options.port);
  requestPrefixUrl += '/' + [this.options.rootPath, this.options.core, path].join('/');

  requestFullPath = requestPrefixUrl + '?' + params;

  logger.debug('[_requestPost] requestFullPath: ', requestFullPath);
  logger.debug('[_requestPost] data: ', data);

  options = {
    method: 'POST',
    url: requestFullPath,
    json: data,
    headers: {
      'accept' : 'application/json; charset=utf-8',
      'content-type' : 'application/json; charset=utf-8'
    }
  };
  request(options, function (err, res, body) {
    var result;
    /* istanbul ignore next */
    if (err) {
      return finalCallback(err);
    }
    if (res.statusCode !== 200) {
      logger.error(body);
      return finalCallback('Solr server error: ' + res.statusCode);
    }
    /* istanbul ignore next */
    try {
      result = JSON.parse(body);
      return finalCallback(null, result);
    } catch(e) {
      return finalCallback(null, body);
    }
  });
};

/**
 * Make Query instance and return
 *
 * @returns {Object}
 */
Client.prototype.query = function() {
  return new Query();
};

/**
 * Search
 *
 * @param {Object|String} query
 * @param {Function} finalCallback - (err, result)
 */
Client.prototype.search = function(query, finalCallback) {
  this._requestGet(this.SEARCH_PATH, query, finalCallback);
};

/**
 * Terms
 *
 * @param {Object|String} query
 * @param {Function} finalCallback - (err, result)
 */
Client.prototype.terms = function(query, finalCallback) {
  this._requestGet(this.TERMS_PATH, query, finalCallback);
};

/**
 * Mlt
 *
 * @param {Object|String} query
 * @param {Function} finalCallback - (err, result)
 */
Client.prototype.mlt = function(query, finalCallback) {
  this._requestGet(this.MLT_PATH, query, finalCallback);
};

/**
 * Spell
 *
 * @param {Object|String} query
 * @param {Function} finalCallback - (err, result)
 */
Client.prototype.spell = function(query, finalCallback) {
  this._requestGet(this.SPELL_PATH, query, finalCallback);
};

/**
 * Update
 *
 * @param {Object} data - json data
 * @param {Object|Function} [options] - update options
 * @param {Function} finalCallback - (err, result)
 */
Client.prototype.update = function(data, options, finalCallback) {
  var bodyData;
  if (arguments.length < 3 && _.isFunction(options)) {
    finalCallback = options;
    options = { commit: true }; // 'commit:true' option is default
  }
  bodyData = {
    add: {
      doc: data,
      overwrite: true
    }
  };
  this._requestPost(this.UPDATE_PATH, bodyData, options, finalCallback);
};

/**
 * Delete
 *
 * @param {String|Object} query - query
 * @param {Object|Function} [options] - delete options
 * @param {Function} finalCallback - (err, result)
 */
Client.prototype.delete = function(query, options, finalCallback) {
  var bodyData, bodyQuery;
  if (arguments.length < 3 && _.isFunction(options)) {
    finalCallback = options;
    options = { commit: true }; // 'commit:true' option is default
  }

  if (_.isString(query)) {
    bodyQuery = query;
  } else if (_.isObject(query)) {
    bodyQuery = QueryString.stringify(query, ' AND ', ':');
  } else {
    bodyQuery = '';
  }

  bodyData = {
    'delete': {
      query: bodyQuery
    }
  };

  this._requestPost(this.UPDATE_PATH, bodyData, options, finalCallback);
};

/**
 * Ping
 *
 * @param {Function} finalCallback - (err, result)
 */
Client.prototype.ping = function(finalCallback) {
  this._requestGet(this.PING_PATH, '', finalCallback);
};

/**
 * Commit
 *
 * @param {Function} finalCallback - (err, result)
 */
Client.prototype.commit = function(finalCallback) {
  this._requestPost(this.UPDATE_PATH, {}, {commit: true}, finalCallback);
};

/**
 * SoftCommit
 *
 * @param {Function} finalCallback - (err, result)
 */
Client.prototype.softCommit = function(finalCallback) {
  this._requestPost(this.UPDATE_PATH, {}, {softCommit: true}, finalCallback);
};


module.exports = Client;