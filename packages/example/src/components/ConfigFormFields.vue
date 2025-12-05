<script lang="ts">
import { type ExampleConfig } from '../types';
import { defineComponent, computed } from 'vue';
import { getOAuthCallbackUrl } from '../config';

const keys: (keyof ExampleConfig)[] = [
  'gitlabUrl',
  'projectPath',
  'gitRef',
  'gitlabToken',
  'telemetryEnabled',
  'extensionMarketplaceEnabled',
  'extensionMarketplaceDisabledReason',
  'authType',
  'clientId',
  'languageServerEnabled',
  'settingsContextHash',
];

interface ExtensionMarketplaceOption {
  label: string;
  value:
    | 'enabled'
    | 'disabled'
    | 'disabled_enterprise_group'
    | 'disabled_instance'
    | 'disabled_opt_in_unset'
    | 'disabled_opt_in_disabled';
  params: Pick<ExampleConfig, 'extensionMarketplaceEnabled' | 'extensionMarketplaceDisabledReason'>;
}

const EXTENSION_MARKETPLACE_OPTIONS: ExtensionMarketplaceOption[] = [
  {
    label: 'Enabled',
    value: 'enabled',
    params: {
      extensionMarketplaceEnabled: true,
      extensionMarketplaceDisabledReason: undefined,
    },
  },
  {
    label: 'Disabled',
    value: 'disabled',
    params: {
      extensionMarketplaceEnabled: false,
      extensionMarketplaceDisabledReason: undefined,
    },
  },
  {
    label: 'Disabled - Enterprise Group',
    value: 'disabled_enterprise_group',
    params: {
      extensionMarketplaceEnabled: false,
      extensionMarketplaceDisabledReason: 'enterprise_group_disabled',
    },
  },
  {
    label: 'Disabled - Instance',
    value: 'disabled_instance',
    params: {
      extensionMarketplaceEnabled: false,
      extensionMarketplaceDisabledReason: 'instance_disabled',
    },
  },
  {
    label: 'Disabled - Opt In Unset',
    value: 'disabled_opt_in_unset',
    params: {
      extensionMarketplaceEnabled: false,
      extensionMarketplaceDisabledReason: 'opt_in_unset',
    },
  },
  {
    label: 'Disabled - Opt In Disabled',
    value: 'disabled_opt_in_disabled',
    params: {
      extensionMarketplaceEnabled: false,
      extensionMarketplaceDisabledReason: 'opt_in_disabled',
    },
  },
];

const AUTH_OPTIONS = [
  {
    label: 'OAuth',
    value: 'oauth',
  },
  {
    label: 'Token',
    value: 'token',
  },
];

export default defineComponent({
  props: keys,
  emits: {
    update(key: keyof ExampleConfig, _value: string | boolean) {
      return Boolean(key);
    },
  },
  setup(props, { emit }) {
    // computeds
    const extensionMarketplaceValue = computed({
      get(): ExtensionMarketplaceOption['value'] {
        if (props.extensionMarketplaceEnabled) {
          return 'enabled';
        }

        switch (props.extensionMarketplaceDisabledReason) {
          case 'instance_disabled':
            return 'disabled_instance';
          case 'opt_in_unset':
            return 'disabled_opt_in_unset';
          case 'opt_in_disabled':
            return 'disabled_opt_in_disabled';
          case 'enterprise_group_disabled':
            return 'disabled_enterprise_group';
          default:
            return 'disabled';
        }
      },

      set(val) {
        const option = EXTENSION_MARKETPLACE_OPTIONS.find(x => x.value === val);

        if (!option) {
          return;
        }

        Object.entries(option.params).forEach(([key, value]) => {
          emit('update', key, value);
        });
      },
    });

    // methods
    const updateKey = (key: keyof ExampleConfig, event: Event) => {
      const el = event.target as HTMLInputElement;

      const isCheckbox = el.type === 'checkbox';

      emit('update', key, isCheckbox ? el.checked : el.value);
    };

    // what: Make sure we have a valid authType selected
    if (!AUTH_OPTIONS.map(x => x.value).includes(props.authType)) {
      emit('update', 'authType', AUTH_OPTIONS[0].value);
    }

    return {
      updateKey,
      AUTH_OPTIONS,
      EXTENSION_MARKETPLACE_OPTIONS,
      extensionMarketplaceValue,
      callbackUrl: getOAuthCallbackUrl(),
    };
  },
});
</script>

<template>
  <div>
    <label class="block">
      <span>GitLab URL</span>
      <input
        name="gitlab_url"
        class="gl-input"
        type="text"
        placeholder="URL of GitLab instance (e.g. https://gitlab.com)"
        :value="gitlabUrl"
        @input="updateKey('gitlabUrl', $event)"
      />
    </label>
    <label class="block mt-3">
      <span>Project Path</span>
      <input
        name="project_path"
        class="gl-input"
        type="text"
        placeholder="Path to GitLab project (e.g. gitlab-org/gitlab)"
        :value="projectPath"
        @input="updateKey('projectPath', $event)"
      />
    </label>
    <label class="block mt-3">
      <span>Git Ref</span>
      <input
        name="ref"
        class="gl-input"
        type="text"
        placeholder="Commit or branch name (e.g. main)"
        :value="gitRef"
        @input="updateKey('gitRef', $event)"
      />
    </label>
    <label class="block mt-3">
      <input
        name="code_suggestions_enabled"
        type="checkbox"
        :value="codeSuggestionsEnabled"
        :checked="codeSuggestionsEnabled"
        @input="updateKey('codeSuggestionsEnabled', $event)"
      />
      <span class="ml-3">Enable code suggestions</span>
    </label>
    <label class="block mt-3">
      <input
        name="telemetry_enabled"
        type="checkbox"
        :value="telemetryEnabled"
        :checked="telemetryEnabled"
        @input="updateKey('telemetryEnabled', $event)"
      />
      <span class="ml-3">Enable telemetry</span>
    </label>
    <label class="block mt-3">
      <input
        name="language_server_enabled"
        type="checkbox"
        :value="languageServerEnabled"
        :checked="languageServerEnabled"
        @input="updateKey('languageServerEnabled', $event)"
      />
      <span class="ml-3">Enable language server</span>
    </label>
    <label class="block mt-3">
      <span>Extension Marketplace</span>
      <select
        name="extension_marketplace_enabled"
        class="gl-input"
        :value="extensionMarketplaceValue"
        @input="extensionMarketplaceValue = $event.target.value"
      >
        <option
          v-for="{ label, value } in EXTENSION_MARKETPLACE_OPTIONS"
          :key="value"
          :value="value"
        >
          {{ label }}
        </option>
      </select>
    </label>
    <label v-if="extensionMarketplaceValue === 'enabled'" class="block mt-3">
      <span>Settings Context Hash</span>
      <input
        name="settings_context_hash"
        class="gl-input"
        type="text"
        :value="settingsContextHash"
        @input="updateKey('settingsContextHash', $event)"
      />
    </label>
    <label class="block mt-3">
      <span>Authentication Type</span>
      <select
        name="auth_type"
        class="gl-input"
        :value="authType"
        @input="updateKey('authType', $event)"
      >
        <option v-for="{ value, label } in AUTH_OPTIONS" :key="value" :value="value">
          {{ label }}
        </option>
      </select>
    </label>
    <template v-if="authType === 'token'">
      <label class="block mt-3">
        <span>Gitlab Token</span>
        <input
          name="gitlab_token"
          class="gl-input"
          type="password"
          :value="gitlabToken"
          @input="updateKey('gitlabToken', $event)"
        />
      </label>
    </template>
    <template v-else-if="authType === 'oauth'">
      <label class="block mt-3">
        <span>Client ID</span>
        <input
          name="client_id"
          class="gl-input"
          type="text"
          placeholder="OAuth Application Client ID"
          :value="clientId"
          @input="updateKey('clientId', $event)"
        />
      </label>
      <div class="text-gray-600">
        <small>
          The OAuth Application should have the following Redirect URL:
          <code>{{ callbackUrl }}</code>
        </small>
      </div>
    </template>
  </div>
</template>
