<template>
  <div
    v-if="socialMediaList.length > 0"
    :class="[
      'social-media-connect',
      `social-media-connect--${type}`,
      {
        'social-media-connect--center': !!center,
        'social-media-connect--colorful': !!colorful,
      },
    ]"
  >
    <div>

      <ul>
        <li
          v-for="socialMedia in socialMediaList"
          :key="socialMedia.id"
        >
          <div
            class="social-media-connect__button-wrapper"
          >
            <button
              :class="[
                'social-media-connect__button',
                `social-media-connect__button--${socialMedia.id}`,
                `social-media-connect__button--${
                  getIsConnected(socialMedia) ? 'connected' : 'disconnected'
                }`,
              ]"
              :title="getSocialMediaTitle(socialMedia)"
              type="button"
              @click="onClickConnectButton(socialMedia)"
            >
              <simple-svg
                :filepath="getIconPath(socialMedia.id)"
                :height="iconSize"
                :width="iconSize"
                fill="white"
              />
            </button>
            <div
              v-if="isLarge"
              class="social-media-connect__label"
            >
              <i18n
                v-if="!getIsConnected(socialMedia)"
                class="social-media-connect__label--connect"
                path="SocialMediaConnect.button.connectToPlatform"
                @click="onClickConnectButton(socialMedia)"
              >
                <span place="platform">{{ socialMedia.id }}</span>
              </i18n>
              <p
                v-else
                class="social-media-connect__label--connected"
                @click="onClickConnectButton(socialMedia)"
              >
                <span>{{ getSocialMediaUserDisplayName(socialMedia.id) }}</span>
                <span>@{{ socialMedia.id }}</span>
              </p>
              <md-field
                v-if="isLarge && getIsConnected(socialMedia) && socialMedia.id === 'facebook'"
              >
                <span class="lc-color-gray-9b lc-font-size-12">
                  {{ $t('SocialMediaConnect.label.linkTo') }}
                </span>
                <md-select
                  v-if="linkedFacebookAc"
                  v-model="linkedFacebookAc"
                  class="social-select-field"
                  @md-selected="onSelectFacebookPageLink"
                >
                  <md-option
                    v-for="page in facebookPages"
                    :key="page.id"
                    :value="page.id"
                  >
                    {{ page.name }}
                  </md-option>
                </md-select>
              </md-field>
            </div>
          </div>
          <md-button
            v-if="isLarge && getIsConnected(socialMedia)"
            class="md-icon-button"
            @click="onClickDisconnectButton(socialMedia)"
          >
            <simple-svg
              :filepath="DeleteIcon"
              height="24px"
              width="24px"
            />
          </md-button>
        </li>

        <!-- show until more platforms are supported
        <li v-if="isMini">
          <md-button
            class="social-media-connect__add-button md-icon-button"
            type="button"
            :to="{ name: 'in-settings' }"
          >
            <simple-svg
              :filepath="getIconPath('add')"
              fill="#C0C0C0"
              width="22px"
              height="22px"
            />
          </md-button>
        </li>
        -->
      </ul>

    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import DeleteIcon from '~/assets/icons/cross.svg';
import LikeCoinIcon from '~/assets/logo/icon.svg';

import {
  EMAIL_REGEX,
  SOCIAL_MEDIA_LIST,
  IS_LGOIN_SOCIAL,
} from '@/constant';

import { openURL } from '~/util/client';
import { logTrackerEvent } from '@/util/EventLogger';
import { getUrlWithPrefix } from '@/util/social';

const TYPE = {
  READONLY: 'readonly',
  MINI: 'mini',
  LARGE: 'large',
};

const iconFolder = require.context('../assets/icons/social-media/');

export default {
  name: 'social-media-connect',
  props: {
    type: {
      type: String,
      default: TYPE.READONLY,
      validator(value) {
        return !!TYPE[value.toUpperCase()];
      },
    },
    platforms: {
      type: Object,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    center: {
      type: [Boolean, String],
      default: false,
    },
    limit: {
      type: Number,
      default: undefined,
    },
    userLink: {
      type: String,
      default: undefined,
    },
    colorful: {
      type: [Boolean, String],
      default: false,
    },
  },
  data() {
    return {
      DeleteIcon,
      linkedFacebookAc: null,
    };
  },
  computed: {
    isMini() {
      return this.type === TYPE.MINI;
    },
    isLarge() {
      return this.type === TYPE.LARGE;
    },
    iconSize() {
      return this.type === TYPE.LARGE ? '28px' : '36px';
    },
    socialMediaList() {
      const platforms = SOCIAL_MEDIA_LIST
        .filter((socialMedia) => {
          const { tier } = socialMedia;
          const isConnected = this.getIsConnected(socialMedia);
          return (
            (this.type === TYPE.READONLY && isConnected)
            || (this.type === TYPE.MINI && (isConnected || tier === 1))
            || (this.type === TYPE.LARGE && tier > 0)
          );
        });

      const links = Object.keys(this.platforms)
        .filter(id => this.platforms[id].isExternalLink)
        .map(id => ({ id, url: this.platforms[id].url }));
      links.sort(({ id: id1 }, { id: id2 }) => (
        this.platforms[id1].order - this.platforms[id2].order
      ));

      return [...platforms, ...links].slice(0, this.limit);
    },
    facebookPages() {
      return [
        {
          id: this.platforms.facebook.id,
          name: this.$t('SocialMediaConnect.label.fbWall'),
        },
        ...(this.platforms.facebook.pages || []),
      ];
    },
    ...mapGetters(['getUserInfo']),
  },
  watch: {
    platforms: {
      handler(p) {
        if (this.isLarge) {
          this.refreshAddtionalDetails(p);
        }
      },
      deep: true,
    },
  },
  mounted() {
    if (this.isLarge) {
      this.refreshAddtionalDetails(this.platforms);
    }
  },
  methods: {
    ...mapActions([
      'fetchSocialPlatformLink',
      'linkSocialPlatform',
      'selectFacebookPageLink',
    ]),
    getIconPath(id) {
      try {
        const filePath = this.platforms[id] && this.platforms[id].isExternalLink
          ? `link/${this.platforms[id].iconType}`
          : id;
        return iconFolder(`./${filePath}.svg`);
      } catch (err) {
        return LikeCoinIcon;
      }
    },
    getIsConnected({ id, tier } = {}) {
      const platform = this.platforms[id];
      return !this.getIsLegacyConnect(id, platform && platform.isLogin) && (
        !!platform || (tier === 0 && (id === 'likecoin' && this.userLink))
      );
    },
    getSocialMediaUserDisplayName(id) {
      return this.platforms[id].displayName;
    },
    getIsLegacyConnect(id, isLogin) {
      return IS_LGOIN_SOCIAL.has(id) && !isLogin;
    },
    onClickConnectButton(socialMedia) {
      const { id, tier } = socialMedia;
      const platform = this.platforms[id];
      const isConnected = !!platform || tier === 0;
      if (!isConnected || this.getIsLegacyConnect(id, platform && platform.isLogin)) {
        this.connect(socialMedia);
      } else {
        const { url } = platform;
        if (url) {
          const isEmail = new RegExp(EMAIL_REGEX).test(url);
          let urlPath = this.getSocialMediaUrl(socialMedia);
          if (isEmail) {
            urlPath = `mailto:${url}`;
          }
          openURL(this, urlPath, '_blank');
          logTrackerEvent(this, 'LikeWidget', 'ClickSocialMedia', id, 1);
        }
      }
    },
    onClickDisconnectButton(socialMedia) {
      this.$emit('disconnect', socialMedia.id);
    },
    async connect(socialMedia) {
      switch (socialMedia.id) {
        case 'facebook': {
          if (!window.FB) return;
          window.FB.login((response) => {
            if (response.authResponse.accessToken) {
              this.linkSocialPlatform({
                platform: 'facebook',
                payload: {
                  user: this.username,
                  access_token: response.authResponse.accessToken,
                },
              });
            } else {
              // error case
            }
          }, { scope: 'public_profile,pages_show_list,user_link' });
          break;
        }
        default: {
          const { url } = await this.fetchSocialPlatformLink({
            platform: socialMedia.id,
            id: this.username,
          });
          document.location = url;
          break;
        }
      }
    },
    async onSelectFacebookPageLink(pageId) {
      await this.selectFacebookPageLink({
        pageId,
        payload: {
          user: this.getUserInfo.user,
        },
      });
    },
    refreshAddtionalDetails(platforms) {
      if (platforms && platforms.facebook) {
        const { facebook } = platforms;
        let model = facebook.id;
        (facebook.pages || []).forEach((page) => {
          if (page.link === facebook.url) {
            model = page.id;
          }
        });
        // show which facebook page/ac is currently shown in public
        this.linkedFacebookAc = model;
      }
    },
    getSocialMediaUrl({ id }) {
      const platform = this.platforms[id];
      switch (id) {
        case 'likecoin':
          return this.userLink;
        default:
          if (platform) return getUrlWithPrefix(platform.url);
          return null;
      }
    },
    getSocialMediaTitle({ id }) {
      const platform = this.platforms[id];
      return /link\d+/.test(id) ? platform.siteDisplayName : id;
    },
  },
};
</script>

<style lang="scss" scoped>
@import "~assets/variables";

$hover-color-map: (
  likecoin: $like-green,
  facebook: #3b5998,
  flickr: #0063dc,
  instagram: #c7548a,
  medium: #231f20,
  twitter: #1ea1f2,
);

.social-media-connect {
  > div {
    display: flex;
  }
  &--center > div {
    justify-content: center;
  }

  ul {
    display: flex;
    flex-wrap: wrap;

    margin: -10px -8px;
    padding: 0;

    list-style: none;

    > li {
      display: flex;
      flex-shrink: 0;

      padding: 8px 6px;
    }
  }

  &__button-wrapper {
    max-width: 100%;

    cursor: pointer;

    &:hover {
      .social-media-connect__button {
        background-color: darken($like-gray-5, 10);
      }

      .social-media-connect__label--connect {
        color: darken($like-gray-4, 10);
      }
    }
    &:active {
      .social-media-connect__button {
        background-color: darken($like-gray-5, 20);
      }
    }
  }


  &__button {
    margin: 2px;

    cursor: pointer;
    transition: background-color .25s ease;

    border: none;
    border-radius: 50%;
    background-color: $like-gray-5;

    &--disconnected {
      background-color: $gray-c0;

      &:hover {
        background-color: darken($gray-c0, 20);
      }
      &:active {
        background-color: darken($gray-c0, 30);
      }
    }

    @each $key, $value in $hover-color-map {
      &--#{$key}#{&}--connected {
        &:hover,
        .social-media-connect--colorful & {
          background-color: $value;

          &:hover {
            background-color: lighten($value, 4);
          }
          &:active {
            background-color: darken($value, 2);
          }
        }
        &:active {
          background-color: darken($value, 10);
        }
      }
    }
  }

  &__add-button {
    margin: 0 -7px;
    padding: 7px;
  }

  &--large {
    li {
      width: 50%;

      @media (max-width: 600px) {
        width: 100%;
      }

      .md-icon-button {
        width: 24px;
        min-width: auto;
        height: 24px;
        margin-top: 3px;

        :global(.md-ripple) {
          padding: 0;
        }
      }
    }

    .social-media-connect {
      &__button-wrapper {
        display: inline-flex;
        align-items: center;
      }

      &__label {
        margin-left: 8px;

        p {
          overflow: hidden;

          cursor: pointer;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        &--connect {
          text-decoration: underline;

          color: $like-gray-4;

          span {
            text-transform: capitalize;
          }
        }

        &--connected {
          font-weight: 600;

          span:first-child {
            color: $like-green;
          }

          span:last-child {
            color: $gray-9b;
          }
        }
      }
    }
  }

  .social-select-field {
    :global(.md-input) {
      padding-bottom: 4px;
    }
  }
}

.md-field {
  align-items: center;

  min-height: auto;
  margin: 0;
  padding-top: 0;

  &:before,
  &:after {
    content: none;
  }

  .md-menu {
    margin-left: 4px;

    :global(.md-input) {
      height: 24px;
      margin-top: -4px;
      padding-top: 4px;

      border-bottom: 1px solid $like-gray-5;

      font-size: 12px;
      font-weight: 600;

      -webkit-text-fill-color: $like-gray-5;
      &::placeholder {
        font-size: 12px;
      }
    }
  }

  :global(.md-icon) {
    width: 20px;
    min-width: auto;
    height: 20px;
  }
}

button[class*=social-media-connect__button--link] {
  background-color: transparent !important;
}
</style>
