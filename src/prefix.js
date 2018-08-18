let _prefix;

export function prefixedModuleName(name) {
  return _prefix ? `${_prefix}.${name}` : name;
}

export function prefixedName(name) {
  if (_prefix) {
    return _prefix + name.charAt(0).toUpperCase();
  } else {
    return name;
  }
}

export function setPrefix(prefix) {
  _prefix = prefix;
}
