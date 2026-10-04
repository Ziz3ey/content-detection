const { assertValidCategory } = require("../config/categories");
const { normalizeText } = require("../utils/normalize-text");

function createNode() {
  return {
    children: new Map(),
    failure: null,
    directOutputs: [],
    outputs: [],
  };
}

class AhoCorasick {
  constructor(patterns) {
    if (!Array.isArray(patterns)) {
      throw new TypeError("Patterns must be an array.");
    }

    this.root = createNode();
    this.root.failure = this.root;
    this.built = false;

    const registeredPatterns = new Set();

    for (const entry of patterns) {
      if (entry === null || typeof entry !== "object") {
        throw new TypeError(
          "Each pattern must include a pattern and category.",
        );
      }

      const pattern = normalizeText(entry.pattern);
      assertValidCategory(entry.category);

      const registryKey = JSON.stringify([pattern, entry.category]);
      if (registeredPatterns.has(registryKey)) {
        continue;
      }
      registeredPatterns.add(registryKey);

      let node = this.root;
      for (let index = 0; index < pattern.length; index += 1) {
        const character = pattern[index];
        if (!node.children.has(character)) {
          node.children.set(character, createNode());
        }
        node = node.children.get(character);
      }

      node.directOutputs.push({ pattern, category: entry.category });
    }

    this.build();
  }

  build() {
    const queue = [];
    this.root.outputs = this.root.directOutputs.slice();

    for (const child of this.root.children.values()) {
      child.failure = this.root;
      child.outputs = child.directOutputs.slice();
      queue.push(child);
    }

    for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
      const node = queue[queueIndex];

      for (const [character, child] of node.children) {
        let fallback = node.failure;

        while (fallback !== this.root && !fallback.children.has(character)) {
          fallback = fallback.failure;
        }

        if (fallback.children.has(character)) {
          child.failure = fallback.children.get(character);
        } else {
          child.failure = this.root;
        }

        child.outputs = child.directOutputs.concat(child.failure.outputs);
        queue.push(child);
      }
    }

    this.built = true;
    return this;
  }

  search(text) {
    const normalizedText = normalizeText(text);
    if (!this.built) {
      this.build();
    }

    const matches = [];
    let node = this.root;

    for (let index = 0; index < normalizedText.length; index += 1) {
      const character = normalizedText[index];

      while (node !== this.root && !node.children.has(character)) {
        node = node.failure;
      }

      if (node.children.has(character)) {
        node = node.children.get(character);
      }

      for (const output of node.outputs) {
        const end = index;
        matches.push({
          pattern: output.pattern,
          category: output.category,
          start: end - output.pattern.length + 1,
          end,
        });
      }
    }

    return matches.sort(
      (left, right) =>
        left.start - right.start ||
        left.end - right.end ||
        left.pattern.localeCompare(right.pattern) ||
        left.category.localeCompare(right.category),
    );
  }
}

module.exports = { AhoCorasick };
