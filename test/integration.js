var assert = require('power-assert');
var simulant = require('simulant');
var queue = require('d3-queue').queue;
var createFocusGroup = require('..');

var arrowUpEvent = { keyCode: 38 };
var arrowDownEvent = { keyCode: 40 };
var arrowLeftEvent = { keyCode: 37 };
var arrowRightEvent = { keyCode: 39 };

var nodeOne = document.createElement('button');
nodeOne.innerHTML = 'one';
document.body.appendChild(nodeOne);
var nodeTwo = document.createElement('button');
nodeTwo.innerHTML = 'two';
document.body.appendChild(nodeTwo);
var nodeThree = document.createElement('button');
nodeThree.innerHTML = 'three';
document.body.appendChild(nodeThree);
// nodeFour has no text content
var nodeFour = document.createElement('button');
document.body.appendChild(nodeFour);

describe('default settings', function() {
  beforeEach(function() {
    createFocusGroup({
      nodes: [nodeOne, nodeTwo, nodeThree],
    }).activate();
  });

  it('with focus outside the group, arrow and letter keys do not affect focus', function() {
    nodeFour.focus(); // nodeFour is outside group
    simulateKeydown(arrowUpEvent);
    assertActiveElement(nodeFour);
    simulateKeydown(arrowDownEvent);
    assertActiveElement(nodeFour);
    simulateKeydown(arrowLeftEvent);
    assertActiveElement(nodeFour);
    simulateKeydown(arrowRightEvent);
    assertActiveElement(nodeFour);
    simulateKeydown({ keyCode: 70 });
    assertActiveElement(nodeFour);
    simulateKeydown({ keyCode: 88 });
    assertActiveElement(nodeFour);
  });

  describe('with focus inside the group', function() {
    it('down arrow moves focus to next node and sticks on last', function() {
      nodeOne.focus();
      simulateKeydown(arrowDownEvent);
      assertActiveElement(nodeTwo);
      simulateKeydown(arrowDownEvent);
      assertActiveElement(nodeThree);
      simulateKeydown(arrowDownEvent);
      assertActiveElement(nodeThree);
    });

    it('up arrow moves focus to previous node and sticks on first', function() {
      nodeThree.focus();
      simulateKeydown(arrowUpEvent);
      assertActiveElement(nodeTwo);
      simulateKeydown(arrowUpEvent);
      assertActiveElement(nodeOne);
      simulateKeydown(arrowUpEvent);
      assertActiveElement(nodeOne);
    });

    it('left and right arrows and letters do not move focus', function() {
      nodeTwo.focus();
      simulateKeydown(arrowLeftEvent);
      assertActiveElement(nodeTwo);
      simulateKeydown(arrowRightEvent);
      assertActiveElement(nodeTwo);
      simulateKeydown({ keyCode: 70 });
      assertActiveElement(nodeTwo);
      simulateKeydown({ keyCode: 88 });
      assertActiveElement(nodeTwo);
    });
  });
});

describe('all arrows designated', function() {
  beforeEach(function() {
    createFocusGroup({
      nodes: [nodeOne, nodeTwo, nodeThree],
      forwardArrows: ['up', 'left'],
      backArrows: ['down', 'right'],
    }).activate();
  });

  it('up and left arrows move focus forward', function() {
    nodeOne.focus();
    simulateKeydown(arrowUpEvent);
    assertActiveElement(nodeTwo);
    simulateKeydown(arrowLeftEvent);
    assertActiveElement(nodeThree);
  });

  it('up and left arrows move focus back', function() {
    nodeThree.focus();
    simulateKeydown(arrowDownEvent);
    assertActiveElement(nodeTwo);
    simulateKeydown(arrowRightEvent);
    assertActiveElement(nodeOne);
  });
});

describe('wrap: true', function() {
  beforeEach(function() {
    createFocusGroup({
      nodes: [nodeOne, nodeTwo, nodeThree],
      wrap: true,
    }).activate();
  });

  it('down arrow wraps forward', function() {
    nodeTwo.focus();
    simulateKeydown(arrowDownEvent);
    assertActiveElement(nodeThree);
    simulateKeydown(arrowDownEvent);
    assertActiveElement(nodeOne);
  });

  it('up arrow wraps back', function() {
    nodeTwo.focus();
    simulateKeydown(arrowUpEvent);
    assertActiveElement(nodeOne);
    simulateKeydown(arrowUpEvent);
    assertActiveElement(nodeThree);
  });
});

describe('letterNavigation: true', function() {
  beforeEach(function() {
    createFocusGroup({
      nodes: [nodeOne, nodeTwo, nodeThree, nodeFour],
      letterNavigation: true,
    }).activate();
  });

  it('letter moves to next node with that letter, cycling', function(done) {
    nodeOne.focus();
    var q = queue(1);
    q.defer(after, 0, function() {
      simulateKeydown({ keyCode: 79 }); // "o"
      assertActiveElement(nodeOne);
    });
    q.defer(after, 300, function() {
      simulateKeydown({ keyCode: 84 }); // "t"
      assertActiveElement(nodeOne, '300ms continues old search');
    });
    q.defer(after, 805, function() {
      simulateKeydown({ keyCode: 84 }); // "t"
      assertActiveElement(nodeTwo, '805ms starts new search');
    });
    q.defer(after, 10, function() {
      simulateKeydown({ keyCode: 72 }); // "h"
      assertActiveElement(nodeThree, 'another key after 10ms extends search');
    });
    q.defer(after, 10, function() {
      simulateKeydown({ keyCode: 79 }); // "o"
      assertActiveElement(nodeThree, 'another key that produces an irrelevant search does not move focus');
    });
    q.defer(after, 805, function() {
      simulateKeydown({ keyCode: 84 }); // "t"
      assertActiveElement(nodeTwo, 'after another 805ms the search has reset');
    });
    q.awaitAll(done);
  });

  it('non-letters do nothing', function() {
    nodeOne.focus();
    simulateKeydown({ keyCode: 54 }); // "5"
    assertActiveElement(nodeOne);
    simulateKeydown({ keyCode: 188 }); // ","
    assertActiveElement(nodeOne);
  });

  it('letters keys do nothing when ctrl, meta, or alt are also pressed', function() {
    nodeOne.focus();
    simulateKeydown({ keyCode: 84, ctrlKey: true }) // "t"
    assertActiveElement(nodeOne);
    simulateKeydown({ keyCode: 84, altKey: true }) // "t"
    assertActiveElement(nodeOne);
    simulateKeydown({ keyCode: 84, metaKey: true }) // "t"
    assertActiveElement(nodeOne);
  });
});

describe('deactivate()', function() {
  beforeEach(function() {
    this.focusGroup = createFocusGroup({ nodes: [nodeOne, nodeTwo, nodeThree] }).activate()
  });

  it('does not respond after deactivation', function() {
    this.focusGroup.deactivate()
    nodeOne.focus();
    simulateKeydown(arrowDownEvent);
    assertActiveElement(nodeOne);
    simulateKeydown({ keyCode: 84 }); // "t"
    assertActiveElement(nodeOne);
  });
});

describe('dynamically adding and removing nodes', function() {
  beforeEach(function() {
    this.focusGroup = createFocusGroup().activate();
  });

  it('does nothing without nodes', function() {
    assert.deepEqual(this.focusGroup.getNodes(), []);
    nodeOne.focus();
    simulateKeydown(arrowDownEvent);
    assertActiveElement(nodeOne);
    simulateKeydown({ keyCode: 84 }); // "t"
    assertActiveElement(nodeOne);
  });

  it('works after adding nodes one at a time with addNode()', function() {
    assert.deepEqual(this.focusGroup.getNodes(), []);
    this.focusGroup.addNode(nodeOne);
    this.focusGroup.addNode(nodeTwo);
    assert.deepEqual(this.focusGroup.getNodes(), [
      { node: nodeOne, text: 'one' },
      { node: nodeTwo, text: 'two' },
    ]);
    nodeOne.focus();
    simulateKeydown(arrowDownEvent);
    assertActiveElement(nodeTwo);
  });

  it('works after adding all nodels with setNodes()', function() {
    assert.deepEqual(this.focusGroup.getNodes(), []);
    this.focusGroup.setNodes([nodeThree, nodeFour]);
    assert.deepEqual(this.focusGroup.getNodes(), [
      { node: nodeThree, text: 'three' },
      { node: nodeFour, text: '' },
    ]);
    nodeThree.focus();
    simulateKeydown(arrowDownEvent);
    assertActiveElement(nodeFour);
  });

  it('works while adding and removing nodes at whim', function() {
    assert.deepEqual(this.focusGroup.getNodes(), []);
    this.focusGroup.setNodes([nodeOne, nodeTwo, nodeThree, nodeFour]);
    assert.deepEqual(this.focusGroup.getNodes(), [
      { node: nodeOne, text: 'one' },
      { node: nodeTwo, text: 'two' },
      { node: nodeThree, text: 'three' },
      { node: nodeFour, text: '' },
    ]);

    this.focusGroup.removeNode(nodeTwo);
    assert.deepEqual(this.focusGroup.getNodes(), [
      { node: nodeOne, text: 'one' },
      { node: nodeThree, text: 'three' },
      { node: nodeFour, text: '' },
    ]);
    nodeOne.focus();
    simulateKeydown(arrowDownEvent);
    assertActiveElement(nodeThree);

    this.focusGroup.clearNodes();
    assert.deepEqual(this.focusGroup.getNodes(), []);
    simulateKeydown(arrowDownEvent);
    assertActiveElement(nodeThree);

    this.focusGroup.setNodes([nodeThree, nodeOne]);
    assert.deepEqual(this.focusGroup.getNodes(), [
      { node: nodeThree, text: 'three' },
      { node: nodeOne, text: 'one' },
    ]);
    // Remove node that isn't a part of the group, does nothing
    this.focusGroup.removeNode(nodeFour);
    assert.deepEqual(this.focusGroup.getNodes(), [
      { node: nodeThree, text: 'three' },
      { node: nodeOne, text: 'one' },
    ]);
    simulateKeydown(arrowDownEvent);
    assertActiveElement(nodeOne);
  });
});

describe('when an object without a focus() method is added to the group', function() {
  it('throws an error', function() {
    assert.throws(function() {
      createFocusGroup({ nodes: [nodeOne, nodeTwo, { foo: 'bar' }] }).activate()
    });
  });
});

describe('focusNodeAtIndex', function() {
  beforeEach(function() {
    this.focusGroup = createFocusGroup({ nodes: [nodeOne, nodeTwo, nodeThree, nodeFour] })
      .activate();
  });

  it('works', function() {
    nodeOne.focus();
    this.focusGroup.focusNodeAtIndex(2);
    assertActiveElement(nodeThree);
    this.focusGroup.focusNodeAtIndex(0);
    assertActiveElement(nodeOne);
    this.focusGroup.focusNodeAtIndex(3);
    assertActiveElement(nodeFour);
  });

  it('quietly fails to focus when non-existant index is passed', function() {
    nodeOne.focus();
    this.focusGroup.focusNodeAtIndex(6);
    assertActiveElement(nodeOne);
  });
});

function assertActiveElement(node, message) {
  assert.equal(document.activeElement, node, message);
}

function simulateKeydown(mockEvent) {
  simulant.fire(document, 'keydown', mockEvent);
}

function after(time, fn, done) {
  setTimeout(function() {
    fn();
    done();
  }, time);
}
