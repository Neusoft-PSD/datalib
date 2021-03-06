'use strict';

var assert = require('chai').assert;
var util = require('../src/util');
var load = require('../src/import/load');

var host = 'uwdata.github.io';
var hostsub = 'github.io';
var dir = '/datalib/';
var base = 'http://' + host + dir;
var uri = 'data/flare.json';
var url = base + uri;
var rel = '//' + host + dir + uri;
var file = './test/' + uri;
var fake = 'http://globalhost/invalid.dne';
var text = require('fs').readFileSync(file, 'utf8');

global.XMLHttpRequest = require('./lib/XMLHttpRequest');

describe('load', function() {

  it('should sanitize url', function() {
    assert.equal('file://a.txt', load.sanitizeUrl({
      file: 'a.txt'
    }));
    assert.equal('hostname/a.txt', load.sanitizeUrl({
      url: 'a.txt',
      baseURL: 'hostname'
    }));
    assert.equal('hostname/a.txt', load.sanitizeUrl({
      url: 'a.txt',
      baseURL: 'hostname/'
    }));
    assert.equal('http://h.com/a.txt', load.sanitizeUrl({
      url: '//h.com/a.txt'
    }));
    assert.equal('https://h.com/a.txt', load.sanitizeUrl({
      url: '//h.com/a.txt',
      defaultProtocol: 'https'
    }));
  });
  
  it('should handle client-side sanitization', function() {
    var host = '';
    util.isNode = false;
    global.window = {location: {hostname: 'localhost'}};
    global.document = {
      createElement: function() {
        return {host: host, href: '', hostname: 'localhost'};
      }
    };

    assert.equal('http://localhost/a.txt', load.sanitizeUrl({
      url: 'http://localhost/a.txt',
      domainWhiteList: ['localhost']
    }));

    var host = 'localhost';
    assert.equal('http://localhost/a.txt', load.sanitizeUrl({
      url: 'http://localhost/a.txt',
      domainWhiteList: ['localhost']
    }));

    util.isNode = true;
    delete global.document;
    delete global.window;
  });

  it('should throw error for invalid path', function() {
    assert.throws(function() { return load({}); });
  });

  it('should throw error for empty url', function() {
    assert.throws(function() { return load({url: ''}); });
  });

  it('should load from file path', function(done) {
    load({file: file}, function(error, data) {
      assert.equal(text, data);
      done();
    });
  });

  it('should load from file path synchronously', function() {
    assert.equal(text, load({file: file}));
  });

  it('should infer file load in node', function() {
    assert.equal(text, load({url: file}));
  });

  it('should load from file url', function(done) {
    load({url: 'file://' + file}, function(error, data) {
      assert.equal(text, data);
      done();
    });
  });

  it('should load from http url', function(done) {
    load({url: url}, function(error, data) {
      assert.equal(text, data);
      done();
    });
  });

  it('should error with invalid url', function(done) {
    load({url: url+'.invalid'}, function(error, data) {
      assert.isNull(data);
      assert.isNotNull(error);
      done();
    });
  });

  it('should load from http url synchronously', function() {
    assert.equal(text, load({url: url}));
  });

  it('should load from http base url + uri', function(done) {
    load(
      {baseURL: base, url: uri},
      function(error, data) {
        assert.equal(text, data);
        done();
      }
    );
  });

  it('should load from relative protocol http url', function(done) {
    load({url: rel},
      function(error, data) {
        assert.equal(text, data);
        done();
      }
    );
  });

  it('should load from relative protocol file url', function(done) {
    load({url: '//'+file, defaultProtocol: 'file'},
      function(error, data) {
        assert.equal(text, data);
        done();
      }
    );
  });

  it('should load from white-listed http domain', function(done) {
    load({url: url, domainWhiteList: [host]},
      function(error, data) {
        assert.equal(text, data);
        done();
      }
    );
  });

  it('should load from white-listed http subdomain', function(done) {
    load({url: url, domainWhiteList: [hostsub]},
      function(error, data) {
        assert.equal(text, data);
        done();
      }
    );
  });

  it('should not load from un-white-listed http domain', function(done) {
    load({url: url, domainWhiteList: []},
      function(error, data) {
        assert.isNotNull(error);
        done();
      }
    );
  });

  it('should return error for invalid protocol', function(done) {
    load({url: 'htsp://globalhost/invalid.dne'},
      function(error, data) {
        assert.isNull(data);
        assert.isNotNull(error);
        done();
      }
    );
  });

  it('should support xhr async', function(done) {
    util.isNode = false;
    load({url: file}, function(error, data) {
      util.isNode = true;
      assert.equal(text, data);
      done(); 
    });
  });

  it('should support xhr async fallbacks', function(done) {
    util.isNode = false;
    XMLHttpRequest.prototype.type = 'data';
    load({url: file}, function(error, data) {
      util.isNode = true;
      delete XMLHttpRequest.prototype.type;
      assert.equal(text, data);
      done(); 
    });
  });

  it('should support xhr sync', function() {
    util.isNode = false;
    assert.equal(text, load({url: file}));    
    util.isNode = true;
  });

  it('should return error on failed xhr', function(done) {
    util.isNode = false;
    load({url: fake}, function(error, data) {
      util.isNode = true;
      assert.isNotNull(error);
      assert.isNull(data);
      done(); 
    });
  });

  it('should use XDomainRequest for xhr if available', function(done) {
    util.isNode = false;
    global.XDomainRequest = global.XMLHttpRequest;
    load({url: fake}, function(error, data) {
      util.isNode = true;
      delete global.XDomainRequest;
      assert.isNotNull(error);
      done();
    });
  });

  it('should use onload for xhr if available', function(done) {
    util.isNode = false;
    XMLHttpRequest.prototype.onload = function() {};
    load({url: fake}, function(error, data) {
      util.isNode = true;
      delete XMLHttpRequest.prototype.onload;
      assert.isNotNull(error);
      done();
    });
  });

});
