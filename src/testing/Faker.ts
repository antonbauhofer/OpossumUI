// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
// eslint-disable-next-line no-restricted-imports
import { base, en, Faker as NativeFaker } from '@faker-js/faker';
import path from 'path';

import type {
  RawPackageInfo as ExternalPackageInfo,
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
  RawFrequentLicense,
} from '../ElectronBackend/types/types';
import { HttpClient } from '../Frontend/util/http-client';
import {
  AdvisorySuggestion,
  DefaultVersionResponse,
  GitHubLicenseResponse,
  GitLabLicenseResponse,
  GitLabProjectResponse,
  Links,
  PackageSuggestion,
  PackageSystem,
  packageSystems,
  ProjectSuggestion,
  ProjectType,
  projectTypes,
  SearchSuggestion,
  SearchSuggestionResponse,
  TagResponse,
  VersionKey,
  VersionResponse,
  VersionsResponse,
  WebVersionResponse,
} from '../Frontend/util/package-search-api';
import { PackageSearchHooks } from '../Frontend/util/package-search-hooks';
import {
  AttributionData,
  AttributionsToResources,
  BaseUrlsForSources,
  DiscreteConfidence,
  DisplayPackageInfo,
  ExternalAttributionSource,
  ExternalAttributionSources,
  ProjectMetadata,
  Resources,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
  Source,
} from '../shared/shared-types';

type ManualPackageInfo = Omit<ExternalPackageInfo, 'source'>;
type Tuple<N extends number, T> = N extends N
  ? number extends N
    ? Array<T>
    : _TupleOf<N, T, []>
  : never;
type _TupleOf<
  N extends number,
  T,
  L extends Array<unknown>,
> = L['length'] extends N ? L : _TupleOf<N, T, [T, ...L]>;

class OpossumModule {
  public static metadata(
    props: Partial<ProjectMetadata> = {},
  ): ProjectMetadata {
    return {
      fileCreationDate: faker.date.recent().toISOString(),
      projectId: faker.string.uuid(),
      ...props,
    };
  }

  public static resourceName(): string {
    return faker.word.words({ count: 3 }).toLowerCase().replace(/\W/g, '-');
  }

  public static resourceNames<N extends number>({
    count,
  }: {
    count: N;
  }): Tuple<N, string> {
    return faker.helpers
      .multiple(this.resourceName, {
        count,
      })
      .sort() as Tuple<N, string>;
  }

  public static resources(props?: Resources): Resources {
    return (
      props || {
        [this.resourceName()]: 1,
      }
    );
  }

  public static source(props: Partial<Source> = {}): Source {
    return {
      documentConfidence: faker.number.int({ max: 100 }),
      name: faker.company.name(),
      ...props,
    };
  }

  public static copyright(name = faker.company.name()) {
    return `Copyright (c) ${name}`;
  }

  public static manualPackageInfo(
    props: Partial<ManualPackageInfo> = {},
  ): ManualPackageInfo {
    return {
      attributionConfidence: faker.number.int({
        min: DiscreteConfidence.Low + 1,
        max: DiscreteConfidence.High - 1,
      }),
      copyright: OpossumModule.copyright(),
      licenseName: faker.commerce.productName(),
      packageName: faker.internet.domainWord(),
      packageVersion: faker.system.semver(),
      url: faker.internet.url(),
      packageType: faker.commerce.productMaterial().toLowerCase(),
      ...props,
    };
  }

  public static displayPackageInfo(
    props: Partial<ManualPackageInfo> = {},
  ): DisplayPackageInfo {
    return {
      ...this.manualPackageInfo(props),
      attributionIds: [faker.string.uuid()],
    };
  }

  public static externalPackageInfo(
    props: Partial<ExternalPackageInfo> = {},
  ): ExternalPackageInfo {
    return {
      source: this.source(),
      ...this.manualPackageInfo(props),
    };
  }

  public static attributionId(): string {
    return faker.string.uuid();
  }

  public static manualAttribution(
    props?: Partial<ManualPackageInfo>,
  ): [attributionId: string, attribution: ManualPackageInfo] {
    return [this.attributionId(), this.manualPackageInfo(props)];
  }

  public static manualAttributions(
    props?: Record<string, ManualPackageInfo>,
  ): Record<string, ManualPackageInfo> {
    return (
      props || {
        [this.attributionId()]: this.manualPackageInfo(),
      }
    );
  }

  public static externalAttribution(
    props?: Partial<ExternalPackageInfo>,
  ): [attributionId: string, attribution: ExternalPackageInfo] {
    return [this.attributionId(), this.externalPackageInfo(props)];
  }

  public static externalAttributions(
    props?: Record<string, ExternalPackageInfo>,
  ): Record<string, ExternalPackageInfo> {
    return (
      props || {
        [this.attributionId()]: this.externalPackageInfo(),
      }
    );
  }

  public static resourcesToAttributions(
    props?: ResourcesToAttributions,
  ): ResourcesToAttributions {
    return (
      props || {
        [faker.system.filePath()]: [faker.string.uuid()],
      }
    );
  }

  public static attributionsToResources(
    props?: AttributionsToResources,
  ): AttributionsToResources {
    return (
      props || {
        [faker.string.uuid()]: [faker.system.filePath()],
      }
    );
  }

  public static filePath(...elements: Array<string>): string {
    if (!elements[0]?.startsWith('/')) {
      elements.unshift('');
    }
    return elements.join('/');
  }

  public static folderPath(...elements: Array<string>): string {
    if (!elements[0]?.startsWith('/')) {
      elements.unshift('');
    }
    elements.push('');
    return elements.join('/');
  }

  public static baseUrlsForSources(
    props?: BaseUrlsForSources,
  ): BaseUrlsForSources {
    return (
      props || {
        [faker.system.filePath()]: faker.internet.url(),
      }
    );
  }

  public static externalAttributionSource(
    props?: Partial<ExternalAttributionSource>,
  ): ExternalAttributionSource {
    return {
      name: faker.word.words({ count: 3 }),
      priority: faker.number.int({ min: 1, max: 100 }),
      ...props,
    };
  }

  public static externalAttributionSources(
    props?: ExternalAttributionSources,
  ): ExternalAttributionSources {
    const source = this.externalAttributionSource();
    return {
      ...(props || {
        [source.name]: this.externalAttributionSource(),
      }),
    };
  }

  public static license(
    props?: Partial<RawFrequentLicense>,
  ): RawFrequentLicense {
    const fullName = faker.commerce.productName();

    return {
      defaultText: faker.lorem.sentences(),
      fullName,
      shortName: fullName.match(/\b([A-Z])/g)!.join(''),
      ...props,
    };
  }

  public static inputData(
    props: Partial<ParsedOpossumInputFile> = {},
  ): ParsedOpossumInputFile {
    return {
      metadata: this.metadata(),
      resources: {},
      externalAttributions: {},
      resourcesToAttributions: {},
      ...props,
    };
  }

  public static outputData(
    props: Partial<ParsedOpossumOutputFile> = {},
  ): ParsedOpossumOutputFile {
    return {
      metadata: this.metadata(),
      manualAttributions: {},
      resourcesToAttributions: {},
      resolvedExternalAttributions: new Set([]),
      ...props,
    };
  }

  public static resourcesWithAttributedChildren(
    props: Partial<ResourcesWithAttributedChildren> = {},
  ): ResourcesWithAttributedChildren {
    return {
      paths: [],
      pathsToIndices: {},
      attributedChildren: {},
      ...props,
    };
  }

  public static manualAttributionData(
    props: Partial<AttributionData> = {},
  ): AttributionData {
    return {
      attributions: this.manualAttributions(),
      attributionsToResources: this.attributionsToResources(),
      resourcesToAttributions: this.resourcesToAttributions(),
      resourcesWithAttributedChildren: this.resourcesWithAttributedChildren(),
      ...props,
    };
  }

  public static externalAttributionData(
    props: Partial<AttributionData> = {},
  ): AttributionData {
    return {
      attributions: this.externalAttributions(),
      attributionsToResources: this.attributionsToResources(),
      resourcesToAttributions: this.resourcesToAttributions(),
      resourcesWithAttributedChildren: this.resourcesWithAttributedChildren(),
      ...props,
    };
  }
}

class PackageSearchModule {
  public static usePackageNames() {
    jest.spyOn(PackageSearchHooks, 'usePackageNames').mockReturnValue({
      packageNames: [],
      packageNamesError: null,
      packageNamesLoading: false,
    });
  }

  public static usePackageNamespaces() {
    jest.spyOn(PackageSearchHooks, 'usePackageNamespaces').mockReturnValue({
      packageNamespaces: [],
      packageNamespacesError: null,
      packageNamespacesLoading: false,
    });
  }

  public static usePackageVersions() {
    jest.spyOn(PackageSearchHooks, 'usePackageVersions').mockReturnValue({
      packageVersions: [],
      packageVersionsError: null,
      packageVersionsLoading: false,
    });
  }

  public static packageSystem(): PackageSystem {
    return faker.helpers.arrayElement(packageSystems);
  }

  public static projectType(): ProjectType {
    return faker.helpers.arrayElement(projectTypes);
  }

  public static versionKey(props: Partial<VersionKey> = {}): VersionKey {
    return {
      name: faker.commerce.productName(),
      system: 'NPM',
      version: faker.system.semver(),
      ...props,
    };
  }

  public static versionResponse(
    props: Partial<VersionResponse> = {},
  ): VersionResponse {
    return {
      versionKey: PackageSearchModule.versionKey(),
      publishedAt: faker.date.past().toISOString(),
      isDefault: faker.datatype.boolean(),
      ...props,
    };
  }

  public static defaultVersionResponse(
    props: Partial<DefaultVersionResponse> = {},
  ): DefaultVersionResponse {
    return {
      defaultVersion: faker.system.semver(),
      ...props,
    };
  }

  public static versionsResponse(
    props: Partial<VersionsResponse> = {},
  ): VersionsResponse {
    return {
      versions: faker.helpers.multiple(PackageSearchModule.versionResponse),
      ...props,
    };
  }

  public static licenseTextWithCopyright(
    copyright = OpossumModule.copyright(),
  ) {
    return btoa(
      `${faker.lorem.sentence()}\n${copyright}\n${faker.lorem.sentence()}`,
    );
  }

  public static gitHubLicenseResponse(
    props: Partial<GitHubLicenseResponse> = {},
  ): GitHubLicenseResponse {
    return {
      content: PackageSearchModule.licenseTextWithCopyright(),
      license: { name: faker.commerce.productName() },
      ...props,
    };
  }

  public static gitLabProjectResponse(
    props: Partial<GitLabProjectResponse> = {},
  ): GitLabProjectResponse {
    return {
      license: { name: faker.commerce.productName() },
      license_url: faker.internet.url(),
      ...props,
    };
  }

  public static gitLabLicenseResponse(
    props: Partial<GitLabLicenseResponse> = {},
  ): GitLabLicenseResponse {
    return {
      content: PackageSearchModule.licenseTextWithCopyright(),
      ...props,
    };
  }

  public static packageSuggestion(
    props: Partial<PackageSuggestion> = {},
  ): PackageSuggestion {
    return {
      kind: 'PACKAGE',
      name: faker.internet.domainWord(),
      system: PackageSearchModule.packageSystem(),
      ...props,
    };
  }

  public static projectSuggestion(
    props: Partial<ProjectSuggestion> = {},
  ): ProjectSuggestion {
    return {
      kind: 'PROJECT',
      name: `${faker.internet.domainWord()}/${faker.internet.domainWord()}`,
      projectType: PackageSearchModule.projectType(),
      ...props,
    };
  }

  public static advisorySuggestion(
    props: Partial<AdvisorySuggestion> = {},
  ): AdvisorySuggestion {
    return {
      kind: 'ADVISORY',
      name: faker.internet.domainWord(),
      ...props,
    };
  }

  public static searchSuggestion(): SearchSuggestion {
    return faker.helpers.arrayElement([
      PackageSearchModule.packageSuggestion,
      PackageSearchModule.projectSuggestion,
    ])();
  }

  public static searchSuggestionResponse(
    props: Partial<SearchSuggestionResponse> = {},
  ): SearchSuggestionResponse {
    return {
      results: faker.helpers.multiple(PackageSearchModule.searchSuggestion),
      ...props,
    };
  }

  public static links(props: Partial<Links> = {}): Links {
    return {
      origins: faker.helpers.multiple(faker.internet.url),
      homepage: faker.internet.url(),
      repo: faker.internet.url(),
      issues: faker.internet.url(),
      ...props,
    };
  }

  public static webVersionResponse(
    props: Partial<WebVersionResponse> = {},
  ): WebVersionResponse {
    return {
      version: {
        licenses: faker.helpers.multiple(faker.commerce.productName),
        links: PackageSearchModule.links(),
      },
      ...props,
    };
  }

  public static tagResponse(props: Partial<TagResponse> = {}): TagResponse {
    return {
      name: faker.system.semver(),
      ...props,
    };
  }
}

class Faker extends NativeFaker {
  public readonly opossum = OpossumModule;
  public readonly packageSearch = PackageSearchModule;

  public outputPath(fileName: string): string {
    return path.join('test-output', fileName);
  }

  public httpClient(...body: Array<object>): HttpClient {
    const request = jest.fn();

    body.forEach((item) =>
      request.mockResolvedValueOnce(new Response(JSON.stringify(item))),
    );

    return { request } satisfies Partial<HttpClient> as unknown as HttpClient;
  }
}

export const faker = new Faker({ locale: [en, base] });
