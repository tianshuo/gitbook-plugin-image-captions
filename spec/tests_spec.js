var fs = require('fs');
var path = require('path');
var tester = require('gitbook-tester');
var assert = require('assert');

var thisModulePath = path.join(__dirname, '..');

function basicBuild (content) {
  return tester.builder()
    .withContent(content)
    .withLocalPlugin(thisModulePath)
    .create();
}

function readFile (filename) {
  return fs.readFileSync(path.join(__dirname, 'resources', filename), 'utf-8').trim();
}

describe('gitbook-plugin-image-captions', function () {
  it('should not change content without images', function () {
    return basicBuild('#heading\n\nparagraph')
      .then(function (results) {
        assert.equal(results[0].content, '<h1 id="heading">heading</h1>\n<p>paragraph</p>');
      });
  });

  it('should create caption from alt attribute', function () {
    return basicBuild('![bar](foo.jpg)')
    .then(function (results) {
      assert.equal(results[0].content, '<figure id="fig1.1.1"><img src="foo.jpg" alt="bar"><figcaption>Figure: bar</figcaption></figure>');
    });
  });

  it('should read caption format from option', function () {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {'caption': 'Image - _CAPTION_'}
      }
    };

    return tester.builder()
    .withContent('![bar](foo.jpg)')
    .withBookJson(config)
    .withLocalPlugin(thisModulePath)
    .create()
    .then(function (results) {
      assert.equal(results[0].content, '<figure id="fig1.1.1"><img src="foo.jpg" alt="bar"><figcaption>Image - bar</figcaption></figure>');
    });
  });

  it('should align caption to the left', function () {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {'align': 'left'}
      }
    };

    return tester.builder()
     .withContent('![bar](foo.jpg)')
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function (results) {
       assert.equal(results[0].content, '<figure id="fig1.1.1"><img src="foo.jpg" alt="bar"><figcaption class="left">Figure: bar</figcaption></figure>');
     });
  });

  it('should prefer title attribute if available', function () {
    return basicBuild('![alt text](img.jpg "title text")')
     .then(function (results) {
       assert.equal(results[0].content, '<figure id="fig1.1.1"><img src="img.jpg" alt="alt text" title="title text"><figcaption>Figure: title text</figcaption></figure>');
     });
  });

  it('should ignore images with empty alt', function () {
    return basicBuild('![](img.jpg)')
     .then(function (results) {
       assert.equal(results[0].content, '<p><img src="img.jpg" alt=""></p>');
     });
  });

  it('should ignore images with empty title and fallback to alt', function () {
    return basicBuild('![bar](img.jpg "")')
     .then(function (results) {
       assert.equal(results[0].content, '<figure id="fig1.1.1"><img src="img.jpg" alt="bar"><figcaption>Figure: bar</figcaption></figure>');
     });
  });

  it('should ignore inline images (pre)', function () {
    return basicBuild('foo ![bar](img.jpg)')
     .then(function (results) {
       assert.equal(results[0].content, '<p>foo <img src="img.jpg" alt="bar"></p>');
     });
  });

  it('should ignore inline images (post)', function () {
    return basicBuild('![bar](img.jpg) bar')
     .then(function (results) {
       assert.equal(results[0].content, '<p><img src="img.jpg" alt="bar"> bar</p>');
     });
  });

  it('should ignore inline images', function () {
    return basicBuild('foo ![bar](img.jpg) bar')
     .then(function (results) {
       assert.equal(results[0].content, '<p>foo <img src="img.jpg" alt="bar"> bar</p>');
     });
  });

  it('should ignore multiple images in paragraph', function () {
    return basicBuild('![bar1](foo1.jpg)![bar2](foo2.jpg)')
     .then(function (results) {
       assert.equal(results[0].content, '<p><img src="foo1.jpg" alt="bar1"><img src="foo2.jpg" alt="bar2"></p>');
     });
  });

  it('should handle page numbers', function () {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          caption: 'Image _PAGE_LEVEL_._PAGE_IMAGE_NUMBER_ - _CAPTION_'
        }
      }
    };

    return tester.builder()
     .withContent('![bar](foo.jpg)')
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function (results) {
       assert.equal(results[0].content, '<figure id="fig1.1.1"><img src="foo.jpg" alt="bar"><figcaption>Image 1.1.1 - bar</figcaption></figure>');
     });
  });

  it('should render registry of figures', function () {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          variable_name: 'pictures'
        }
      }
    };

    var pageContent = readFile('image_registry_provided.md');
    var expected = readFile('image_registry_expected.html');

    return tester.builder()
     .withContent(pageContent)
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function (results) {
       assert.equal(results.get('index.html').content, expected);
     });
  });

  it('should render image global index', function () {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          variable_name: 'pictures',
          caption: 'Image _BOOK_IMAGE_NUMBER_. - _CAPTION_'
        }
      }
    };

    var pageContent = readFile('image_bookwide_caption_provided.md');
    var expected = readFile('image_bookwide_caption_expected.html');

    return tester.builder()
     .withContent(pageContent)
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function (results) {
       assert.equal(results[0].content, expected);
     });
  });

  it('should use image specific caption', function () {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          'images': {
            '1.1.1': {
              'caption': 'Special image _PAGE_LEVEL_._PAGE_IMAGE_NUMBER_: _CAPTION_'
            }
          }
        }
      }
    };

    return tester.builder()
     .withContent('![bar](foo.jpg)')
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function (results) {
       assert.equal(results[0].content, '<figure id="fig1.1.1"><img src="foo.jpg" alt="bar"><figcaption>Special image 1.1.1: bar</figcaption></figure>');
     });
  });

  it('should use different caption for figure and for list', function () {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          'variable_name': 'pictures',
          'list_caption': 'List image _BOOK_IMAGE_NUMBER_: _CAPTION_'
        }
      }
    };

    var pageContent = readFile('image_registry_provided.md');
    var expected = readFile('image_list_captions_expected.html');

    return tester.builder()
     .withContent(pageContent)
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function (results) {
       assert.equal(results.get('index.html').content, expected);
     });
  });

  it('should pass default and specific image attributes', function () {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          'attributes': { 'width': '300' },
          'images': {
            '1.1.2': {
              'attributes': {
                'width': '400'
              }
            }
          }
        }
      }
    };

    var pageContent = readFile('image_attributes_provided.md');
    var expected = readFile('image_attributes_expected.html');

    return tester.builder()
     .withContent(pageContent)
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function (results) {
       assert.equal(results[0].content, expected);
     });
  });

  it('should handle image inside link', function () {
    return basicBuild('[![SPE Remoting Module](http://img.youtube.com/vi/fGvT8eDdWrg/0.jpg)](http://www.youtube.com/watch?v=fGvT8eDdWrg "Click for a quick demo")')
     .then(function (results) {
       assert.equal(results[0].content, '<a href="http://www.youtube.com/watch?v=fGvT8eDdWrg" title="Click for a quick demo" target="_blank"><figure id="fig1.1.1"><img src="http://img.youtube.com/vi/fGvT8eDdWrg/0.jpg" alt="SPE Remoting Module"><figcaption>Figure: SPE Remoting Module</figcaption></figure></a>');
     });
  });

  it('should keep order of images and their global indexes', function () {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          variable_name: 'pictures',
          caption: 'Image _BOOK_IMAGE_NUMBER_. - _CAPTION_'
        }
      }
    };

    return tester.builder()
     .withContent('![first](first.jpg)')
     .withPage('second', '![second](second.jpg)')
     .withPage('second_a', '![second a](second_a.jpg)', 1) // subpage, under second
     .withPage('third', '![third](third.jpg)\n\n![fourth](fourth.jpg)')
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function (results) {
       assert.equal(results.get('index.html').content, '<figure id="fig1.1.1"><img src="first.jpg" alt="first"><figcaption>Image 1. - first</figcaption></figure>');
       assert.equal(results.get('second.html').content, '<figure id="fig1.2.1"><img src="second.jpg" alt="second"><figcaption>Image 2. - second</figcaption></figure>');

       // bug in Gitbook 2.0 in numbering of chapters. Second chapter, first subchapter gets level 1.2 instead of 1.1 as in all other versions
       assert.equal(results.get('second_a.html').$('figure figcaption').text(), 'Image 3. - second a');

       assert.equal(results.get('third.html').content, '<figure id="fig1.3.1"><img src="third.jpg" alt="third"><figcaption>Image 4. - third</figcaption></figure>' +
       '\n' + '<figure id="fig1.3.2"><img src="fourth.jpg" alt="fourth"><figcaption>Image 5. - fourth</figcaption></figure>');
     });
  });

  it('Should use custom caption and align together', function () {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          'caption': 'Image Description - _CAPTION_',
          'align': 'left'
        }
      }
    };

    return tester.builder()
     .withContent('![bar](foo.jpg)')
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function (results) {
       var figcaption = results.get('index.html').$('figure figcaption');
       assert.equal(figcaption.text(), 'Image Description - bar');
       assert.equal(figcaption.attr('class'), 'left');
     });
  });

  it('Should skip selected images', function () {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          'images': {
            '1.1.1': {
              'skip': true
            },
            '1.1.2': {
              'skip': false
            }
          }
        }
      }
    };

    return tester.builder()
     .withContent('![bar](foo.jpg)\n\n![lorem](ipsum.jpg)')
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function (results) {
       assert.equal(results.get('index.html').content, '<p><img src="foo.jpg" alt="bar"></p>\n<figure id="fig1.1.2"><img src="ipsum.jpg" alt="lorem"><figcaption>Figure: lorem</figcaption></figure>');
     });
  });
});
