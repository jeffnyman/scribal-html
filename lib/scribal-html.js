'use strict';

var _ = require('lodash');
var path = require('path');
var pug = require('pug');
var fs = require('fs-extra');
var color = require('bash-color');

var util = require('util');

var scribalReader = require('scribal-reader');
var markdown = require('scribal-markdown');

var TEMPLATES_PATH = path.join(__dirname, './META-INF/html');
var NO_SUMMARY_MESSAGE_MD = 'You can put content here by creating a `SUMMARY.md` markdown file.';

function html(specPath, outputPath) {
  var absolute = isPathAbsolutePath(specPath);

  if (!absolute) {
    specPath = process.cwd() + "/" + specPath;
  }

  var compileOptions = {debug: false, pretty: true};
  var indexTemplate = path.join(TEMPLATES_PATH, 'index.pug');
  var featureTemplate = path.join(TEMPLATES_PATH, 'feature.pug');

  var metadata = scribalReader.readMetadataSync(specPath);
  metadata = (metadata === null ? {} : metadata);

  fs.mkdirpSync(outputPath);
  copyMaterials();

  var specStructure = scribalReader.readSpecSourceSync(specPath);

  var indexTemplateCompiled = pug.compileFile(indexTemplate, compileOptions);
  var featureTemplateCompiled = pug.compileFile(featureTemplate, compileOptions);

  generateStructure(specStructure);

  function generateStructure(node, pathPrefix) {
    if (node.type === scribalReader.NODE_FILE) {
      var featurePath = path.join(specPath, node.path);
      var nextPathPrefix = pathPrefix || './';

      try {
        var source = scribalReader.readFeatureSync(featurePath);
        fs.writeFileSync(path.join(outputPath, node.path + '.html'), featureTemplateCompiled({
          pathPrefix: nextPathPrefix,
          path: node.path,
          metadata: metadata,
          specStructure: specStructure,
          source: markdown.descriptionToHTML(source, getMarkdownOptions(nextPathPrefix))
        }));
      } catch(err) {
        console.warn(color.red('Error generating feature `%s`: %s'), featurePath, err);
      }
    }

    if (node.type === scribalReader.NODE_DIRECTORY) {
      fs.mkdirpSync(path.join(outputPath, node.path));

      var summary = scribalReader.readSummarySync(path.join(specPath, node.path)) || NO_SUMMARY_MESSAGE_MD;
      var summaryOutputPath = path.join(outputPath, node.path, 'index.html');
      var nextPathPrefix = pathPrefix ? pathPrefix + '../' : './';

      fs.writeFileSync(summaryOutputPath, indexTemplateCompiled({
        pathPrefix: nextPathPrefix,
        metadata: metadata,
        specStructure: specStructure,
        summary: markdown.render(summary, getMarkdownOptions(nextPathPrefix))
      }));

      node.children.forEach(function (child) {
        generateStructure(child, nextPathPrefix);
      });
    }
  }

  function copyMaterials() {
    var materialsPath = path.join(specPath, 'materials');
    try {
      var stats = fs.statSync(materialsPath);
      if (stats.isDirectory()) {
        fs.copySync(materialsPath, path.join(outputPath, 'materials'));
      }
    } catch(err) {
      // do nothing; is this wise?
    }
  }
}

function isPathAbsolutePath(path) {
  return /^(?:\/|[a-z]+:\/\/)/.test(path);
}

function getMarkdownOptions(pathPrefix) {
  return {
    imageRenderer: getImageRenderer(pathPrefix),
    linkRenderer: getLinkRenderer(pathPrefix)
  };
}

function getImageRenderer(pathPrefix) {
  return function (attrs) {
    var src = attrs.src;
    attrs.src = isMaterial(src) ? removeSchemaPrefix(src) : src;
    return attrs;
  };

  function isMaterial(href) {
    return _.startsWith(href, markdown.MATERIAL_URL_SCHEMA);
  }

  function removeSchemaPrefix(url) {
    return pathPrefix + url.substring(markdown.MATERIAL_URL_SCHEMA.length);
  }
}

function getLinkRenderer(pathPrefix) {
  return function (attrs) {
    var href = attrs.href;
    attrs.href = isFeature(href) ? removeSchemaPrefixAndAppendHtmlSuffix(href) : href;
    return attrs;
  };

  function isFeature(href) {
    return _.startsWith(href, markdown.FEATURE_URL_SCHEMA);
  }

  function removeSchemaPrefixAndAppendHtmlSuffix(url) {
    return pathPrefix + url.substring(markdown.FEATURE_URL_SCHEMA.length) + '.html';
  }
}

module.exports = html;
html.$imageRenderer = getImageRenderer('');
html.$linkRenderer = getLinkRenderer('');
