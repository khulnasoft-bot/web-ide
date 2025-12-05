import { readFile } from 'node:fs/promises';
import path from 'node:path';

type MimeType = 'text' | 'json' | 'image';

export const getFixture = async (fixtureName: string, mimeType: MimeType) => {
  const fixturePath = path.join(path.resolve(__dirname, '..'), 'fixtures', fixtureName);
  const fixtureContent = await readFile(fixturePath, { encoding: 'utf8' });

  return {
    fileContent: mimeType === 'json' ? JSON.parse(fixtureContent) : fixtureContent,
    filePath: fixturePath,
  };
};
