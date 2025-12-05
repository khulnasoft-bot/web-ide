<script lang="ts">
import { defineComponent, reactive } from 'vue';
import { ExampleConfig } from '../types';
import ConfigFormFields from './ConfigFormFields.vue';

export default defineComponent({
  props: {
    initConfig: {
      required: false,
      default: null,
    },
  },
  emits: {
    submit(config: ExampleConfig) {
      return Boolean(config);
    },
  },
  components: {
    ConfigFormFields,
  },
  setup(props, { emit }) {
    const initConfig = props.initConfig ?? {};

    // state
    const config: ExampleConfig = reactive<ExampleConfig>({
      gitlabUrl: 'https://gitlab.com',
      projectPath: 'gitlab-org/gitlab',
      gitRef: 'master',
      gitlabToken: '',
      clientId: '',
      codeSuggestionsEnabled: false,
      telemetryEnabled: false,
      extensionMarketplaceEnabled: true,
      settingsContextHash: undefined,
      extensionMarketplaceDisabledReason: undefined,
      languageServerEnabled: true,
      authType: 'oauth',
      ...initConfig,
    });

    // callbacks
    const onConfigUpdate = (key: keyof ExampleConfig, value: string) => {
      config[key] = value;
    };

    const onSubmit = () => {
      emit('submit', config);
    };

    return {
      onSubmit,
      config,
      onConfigUpdate,
    };
  },
});
</script>

<template>
  <div class="max-h-full py-5 flex items-center justify-center fixed inset-0">
    <form
      class="w-96 max-h-full overflow-y-auto mt-3 p-3 border rounded bg-white"
      @submit.prevent="onSubmit"
    >
      <config-form-fields v-bind="config" @update="onConfigUpdate" />
      <div class="mt-3 flex items-center justify-center">
        <button type="submit" class="gl-submit-btn">Start GitLab Web IDE</button>
      </div>
    </form>
  </div>
</template>
