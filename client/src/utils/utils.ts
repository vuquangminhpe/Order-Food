const removeSpecialCharacter = (str: string) => {
  // eslint-disable-next-line no-useless-escape
  return str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, '')
}
export const generateNameId = ({ name, id }: { name: string; id: number }) => {
  const formattedName = removeSpecialCharacter(name).replace(/\s/g, '-')
  return `${id}-${formattedName}`
}

export const getIdFromNameId = (nameId: string) => {
  return nameId.split('-')[0]
}

export function formatCurrency(currency: number) {
  return new Intl.NumberFormat('de-DE').format(currency)
}

export function formatNumberToSocialStyle(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumSignificantDigits: 1
  })
    .format(value)
    .replace('.', ',')
}
