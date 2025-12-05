<script lang="ts">
import { defineComponent, ref, nextTick } from 'vue';
import { ExampleConfig } from '../types';
import ConfigForm from './ConfigForm.vue';
import WebIde from './WebIde.vue';
import { saveConfig, loadConfig } from '../configStorage';

export default defineComponent({
  props: {
    autostart: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  components: {
    ConfigForm,
    WebIde,
  },
  setup(props) {
    // if URL contains remote config, it takes precedence over stored config
    const savedConfig = loadConfig();

    // state
    const config = ref<ExampleConfig | undefined>(savedConfig?.config);
    const runWebIde = ref<boolean>(false);

    // callbacks
    const start = () => {
      runWebIde.value = true;
    };

    const onSubmit = (configArg: ExampleConfig) => {
      saveConfig({
        config: configArg,
      });

      config.value = configArg;

      start();
    };

    if (props.autostart) {
      nextTick().then(start);
    }

    return {
      runWebIde,
      onSubmit,
      config,
    };
  },
});
</script>

<template>
  <!-- what: v-if config to help with type safety. runWebIde implies that these are true -->
  <web-ide v-if="runWebIde && config" :config="config" />
  <div v-else>
    <config-form :init-config="config" @submit="onSubmit" />
    <div class="fixed right-0 bottom-0 text-sm text-white">
      Photo by
      <a
        href="https://unsplash.com/@lucabravo?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
        >Luca Bravo</a
      >
      on
      <a
        href="https://unsplash.com/photos/XJXWbfSo2f0?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
        >Unsplash</a
      >
    </div>
  </div>
</template>
