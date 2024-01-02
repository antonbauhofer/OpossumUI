// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';

import { faker } from '../../../shared/Faker';
import { Attributions, ExportType } from '../../../shared/shared-types';
import { writeSpdxFile } from '../writeSpdxFile';

describe('writeSpdxFile', () => {
  it('writes a yaml for empty attributions', () => {
    const yamlPath = faker.outputPath(`${faker.string.uuid()}.yaml`);
    writeSpdxFile(yamlPath, {
      type: ExportType.SpdxDocumentYaml,
      spdxAttributions: {},
    });

    expect(fs.existsSync(yamlPath)).toBe(true);
    const fileContent = fs.readFileSync(yamlPath, 'utf-8');
    expect(fileContent).not.toBeNull();
  });

  it('writes a json for empty attributions', () => {
    const yamlPath = faker.outputPath(`${faker.string.uuid()}.json`);
    writeSpdxFile(yamlPath, {
      type: ExportType.SpdxDocumentJson,
      spdxAttributions: {},
    });

    expect(fs.existsSync(yamlPath)).toBe(true);
    const fileContent = fs.readFileSync(yamlPath, 'utf-8');
    expect(fileContent).toContain('SPDX-2.2');
  });

  it('writes a file for attributions', () => {
    const testAttributions: Attributions = {
      uuid_1: {
        packageName: 'test-Package',
        packageVersion: '1.1',
        licenseText: 'test license text',
        licenseName: 'license name',
      },
      uuid_2: {
        packageName: 'second-test-Package',
        packageVersion: '2.1',
        packageType: 'npm',
      },
    };

    const yamlPath = faker.outputPath(`${faker.string.uuid()}.yaml`);
    writeSpdxFile(yamlPath, {
      type: ExportType.SpdxDocumentYaml,
      spdxAttributions: testAttributions,
    });

    expect(fs.existsSync(yamlPath)).toBe(true);
    const fileContent = fs.readFileSync(yamlPath, 'utf-8');

    expect(fileContent).toContain('spdxVersion: SPDX-2.2');
    expect(fileContent).toContain('name: test-Package');
    expect(fileContent).toContain('extractedText: test license text');
    expect(fileContent).toContain('name: license name');
    expect(fileContent).toContain(
      'referenceLocator: pkg:npm/second-test-Package@2.1',
    );
  });
});
