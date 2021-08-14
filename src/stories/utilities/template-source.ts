export const templateSourceCode = (templateSource, args, replacing = 'v-bind="$props"') => {
  const propToSource = (key, val) => {
    const type = typeof val;
    switch (type) {
      case 'object':
        return `:${key}="${JSON.stringify(val)}"\n`;
      case 'boolean':
        return val ? key + `\n` : '';
      case 'string':
        return `${key}="${val}"\n`;
      default:
        return `:${key}="${val}"\n`;
    }
  };

  return templateSource.replace(
    replacing,
    Object.keys(args)
      .map((key) => propToSource(key, args[key]))
      .join(' ')
  );
};