<template>
  <div class="auth-api-view" />
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'auth-api-view',
  layout: 'blank',
  mounted() {
    this.setAuthDialog({ isShow: true });
  },
  beforeDestroy() {
    this.setAuthDialog({ isShow: false });
  },
  methods: {
    ...mapActions([
      'setAuthDialog',
      'setUserNeedAuth',
      'refreshUser',
      'showLoginWindow',
    ]),
  },
};
</script>
