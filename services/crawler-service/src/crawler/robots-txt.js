function parseRobotsTxt(content, userAgent = "AcademicResearchCrawler/1.0") {
  const groups = [];
  let currentGroup = null;
  let groupHasRules = false;

  for (const line of content.split(/\r?\n/)) {
    const cleanLine = line.split("#", 1)[0].trim();
    const separator = cleanLine.indexOf(":");
    if (separator === -1) {
      continue;
    }

    const directive = cleanLine.slice(0, separator).trim().toLowerCase();
    const value = cleanLine.slice(separator + 1).trim();

    if (directive === "user-agent") {
      if (currentGroup === null || groupHasRules) {
        currentGroup = { agents: [], rules: [] };
        groups.push(currentGroup);
        groupHasRules = false;
      }
      currentGroup.agents.push(value.toLowerCase());
      continue;
    }

    if ((directive === "allow" || directive === "disallow") && currentGroup) {
      groupHasRules = true;
      if (value.length > 0) {
        currentGroup.rules.push({ allow: directive === "allow", path: value });
      }
    }
  }

  const normalizedAgent = userAgent.toLowerCase();
  const specificGroups = groups.filter((group) =>
    group.agents.some(
      (agent) => agent !== "*" && normalizedAgent.includes(agent),
    ),
  );
  const selectedGroups =
    specificGroups.length > 0
      ? specificGroups
      : groups.filter((group) => group.agents.includes("*"));

  return selectedGroups.flatMap((group) => group.rules);
}

function isAllowedByRobots(urlValue, rules) {
  const url = new URL(urlValue);
  const target = `${url.pathname}${url.search}`;
  const matchingRules = rules
    .map((rule) => {
      const endAnchored = rule.path.endsWith("$");
      const path = endAnchored ? rule.path.slice(0, -1) : rule.path;
      const expression = path
        .split("*")
        .map((part) => part.replace(/[|\\{}()[\]^$+?.]/g, "\\$&"))
        .join(".*");

      return {
        ...rule,
        specificity: path.replace(/\*/g, "").length,
        matcher: new RegExp(`^${expression}${endAnchored ? "$" : ""}`),
      };
    })
    .filter((rule) => rule.matcher.test(target))
    .sort((left, right) => right.specificity - left.specificity);

  if (matchingRules.length === 0) {
    return true;
  }

  const mostSpecificLength = matchingRules[0].specificity;
  const equallySpecific = matchingRules.filter(
    (rule) => rule.specificity === mostSpecificLength,
  );
  return equallySpecific.some((rule) => rule.allow);
}

module.exports = { isAllowedByRobots, parseRobotsTxt };
