import { TextQueryConfigs } from '../../../../configs/text-query/text-query.configs';

export function textQueryTransformer(text: string) {
  if (typeof text == 'string') {
    const normalizedText = text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .slice(0, TextQueryConfigs.TEXT_QUERY_MAX_LENGTH)
      .trim();
    if (normalizedText == '') {
      return normalizedText;
    }
    return `%${normalizedText.replace(/\s/g, '%')}%`;
  }
  return text;
}
