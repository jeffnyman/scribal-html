'use strict';

var chai = require('chai');
var expect = chai.expect;

var scribalHtml = require('../../lib/scribal-html');

describe('scribal html generator', function() {
  describe('image rendering', function() {
    var imageRenderer;

    beforeEach(function() {
      imageRenderer = scribalHtml.$imageRenderer;
    });

    it('will not modify the src attribute given any URL', function() {
      expect(imageRenderer({src: 'http://localhost.com/images/testing.gif'}))
        .to.deep.equal({src: 'http://localhost.com/images/testing.gif'});

      expect(imageRenderer({src: 'https://localhost.com/images/testing.gif'}))
        .to.deep.equal({src: 'https://localhost.com/images/testing.gif'});

      expect(imageRenderer({src: 'images/testing.gif'}))
        .to.deep.equal({src: 'images/testing.gif'});
    });

    it('will remove the schema prefix given a URL with the material:// schema', function() {
      expect(imageRenderer({src: 'material://materials/images/testing.gif'}))
        .to.deep.equal({src: 'materials/images/testing.gif'});
    });
  });

  describe('link rendering', function() {
    var linkRenderer;

    beforeEach(function() {
      linkRenderer = scribalHtml.$linkRenderer;
    });

    it('will not modify the href attribute given any URL', function() {
      expect(linkRenderer({href: 'http://localhost.com/index.html'}))
        .to.deep.equal({href: 'http://localhost.com/index.html'});

      expect(linkRenderer({href: 'test/path/index.html'}))
        .to.deep.equal({href: 'test/path/index.html'});

      expect(linkRenderer({href: '/test/path/index.html'}))
        .to.deep.equal({href: '/test/path/index.html'});
    });

    it('will remove the schema prefix and add the .html suffix given a URL with the feature:// schema', function() {
      expect(linkRenderer({href: 'feature://test/path/sample.feature'}))
        .to.deep.equal({href: 'test/path/sample.feature.html'});
    });
  });
});
