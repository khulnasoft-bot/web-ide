pkg_example=packages/example
pkg_example_dist=$(pkg_example)/dist
pkg_example_src=$(pkg_example)/src

pkg_webide=packages/web-ide
pkg_webide_src=$(pkg_webide)/src
pkg_webide_assets=$(pkg_webide)/assets
pkg_webide_assets_all=$(shell find $(pkg_webide_assets) -type f)
pkg_webide_dist=$(pkg_webide)/dist
pkg_webide_dist_index=$(pkg_webide_dist)/index.js
pkg_webide_dist_public=$(pkg_webide_dist)/public
# TODO: Depend on .touch files instead of sources of a dir
pkg_webide_dist_public_sources=\
 $(pkg_webide_dist_public)/main.js \
 $(pkg_webide_dist_public)/assets \
 $(pkg_webide_dist_public)/vscode \
 $(pkg_webide_dist_public)/vscode/extensions/gitlab-language-support-vue \
 $(pkg_webide_dist_public)/vscode/extensions/gitlab-web-ide \
 $(pkg_webide_dist_public)/vscode/extensions/gitlab-vscode-extension \
 $(pkg_webide_dist_public)/vscode/extensions/gitlab-vscode-theme

pkg_vscode_bootstrap=packages/vscode-bootstrap
pkg_vscode_bootstrap_dist=$(pkg_vscode_bootstrap)/dist

pkg_vscode_build=packages/vscode-build
pkg_vscode_build_dist=$(pkg_vscode_build)/dist

pkg_vscode_extension=packages/vscode-extension-web-ide
pkg_vscode_extension_assets=$(pkg_vscode_extension)/assets
pkg_vscode_extension_assets_all=$(shell find $(pkg_vscode_extension_assets) -type f)
pkg_vscode_extension_dist=$(pkg_vscode_extension)/dist
pkg_vscode_extension_dist_assets=$(pkg_vscode_extension_dist)/assets
pkg_vscode_extension_dist_all=\
 $(pkg_vscode_extension_dist)/main.js \
 $(pkg_vscode_extension_dist)/package.json \
 $(pkg_vscode_extension_dist)/package.nls.json \
 $(pkg_vscode_extension_dist)/assets

pkg_vscode_extension_language_support_vue=packages/vscode-extension-language-support-vue
pkg_vscode_extension_language_support_vue_dist=$(pkg_vscode_extension_language_support_vue)/dist
pkg_vscode_extension_language_support_vue_dist_assets=$(pkg_vscode_extension_language_support_vue_dist)/assets
pkg_vscode_extension_language_support_vue_dist_all=\
 $(pkg_vscode_extension_language_support_vue_dist)/package.json\
 ${pkg_vscode_extension_language_support_vue_dist_assets}

pkg_vscode_extension_gitlab_vscode_theme=packages/vscode-extension-gitlab-vscode-theme
pkg_vscode_extension_gitlab_vscode_theme_dist=$(pkg_vscode_extension_gitlab_vscode_theme)/dist
pkg_vscode_extension_gitlab_vscode_theme_jsons=$(shell find $(pkg_vscode_extension_gitlab_vscode_theme) -type f -name '*theme.json' -not -path '*/dist/*')
pkg_vscode_extension_gitlab_vscode_theme_font=$(pkg_vscode_extension_gitlab_vscode_theme)/fonts/gitlab_webide.woff

pkg_vscode_extension_gitlab_vscode_theme_sources=                 \
  ${pkg_vscode_extension_gitlab_vscode_theme}/package.json \
	${pkg_vscode_extension_gitlab_vscode_theme}/icon.png            \
	${pkg_vscode_extension_gitlab_vscode_theme_jsons}               \
  ${pkg_vscode_extension_gitlab_vscode_theme_font}

pkg_vscode_extension_gitlab_vscode_theme_dist_all=             \
  $(pkg_vscode_extension_gitlab_vscode_theme_dist)/package.json \
  $(pkg_vscode_extension_gitlab_vscode_theme_dist)/icon.png     \
  $(pkg_vscode_extension_gitlab_vscode_theme_dist)/fonts/gitlab_webide.woff \
  $(patsubst $(pkg_vscode_extension_gitlab_vscode_theme)/%,$(pkg_vscode_extension_gitlab_vscode_theme_dist)/%,$(pkg_vscode_extension_gitlab_vscode_theme_jsons))

pkg_vscode_extension_gitlab_vscode_extension=packages/vscode-extension-gitlab-vscode-extension
pkg_vscode_extension_gitlab_vscode_extension_dist=$(pkg_vscode_extension_gitlab_vscode_extension)/dist

pkg_gitlab_vscode_extension=$(pkg_vscode_extension_gitlab_vscode_extension_dist)/gitlab-vscode-extension

pkg_gitlab_vscode_extension_dist_browser=$(pkg_gitlab_vscode_extension)/dist-browser

all_env=$(shell find config -type f -name '*.env*')
all_ts=$(shell find packages/ -type f -name '*.ts' -path 'packages/*/src/*' -not -path '*/dist/*')
all_html=$(shell find packages/ -type f -name '*.html' -path 'packages/*/src/*' -not -path '*/dist/*')
all_vue=$(shell find packages/ -type f -name '*.vue' -path 'packages/*/src/*' -not -path '*/dist/*')
all_src=      \
  $(all_env)  \
  $(all_ts)   \
	$(all_html) \
	$(all_vue)  \
	$(pkg_vscode_extension_dist_assets) \
	${pkg_vscode_extension_language_support_vue_dist_assets} \
  ${pkg_vscode_extension_gitlab_vscode_theme_sources}

workflow_src_file_options="-type f -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*.test.*'"
workflow_src=  \
  $(shell find gitlab-vscode-extension/src "${workflow_src_file_options}") \
	$(shell find gitlab-vscode-extension/webviews "${workflow_src_file_options}")

## =======
## web-ide
## =======

list:
	@echo all_ts = $(all_ts)
	@echo ""
	@echo all_html = $(all_html)
	@echo ""
	@echo all_src = $(all_src)
	@echo ""
	@echo workflow_src=$(workflow_src)

$(pkg_webide): $(pkg_webide_dist)

$(pkg_webide_dist): $(pkg_webide_dist_public) $(pkg_webide_dist_index)

$(pkg_webide_dist_index): $(pkg_webide_src)/*
	yarn workspace @gitlab/web-ide run build

$(pkg_webide_dist_public): $(pkg_webide_dist_public_sources)

$(pkg_webide_dist_public)/%.js: $(pkg_vscode_bootstrap_dist)/%.js
	rm -f $@
	mkdir -p $(dir $@)
	cp $(dir $<)*.js $(dir $@)
	cp $(dir $<)*.js.map $(dir $@)

$(pkg_webide_dist_public)/vscode: $(pkg_vscode_build_dist)/vscode
	rm -rf $@
	mkdir -p $(dir $@)
	cp -r $< $@

$(pkg_webide_dist_public)/vscode/extensions/gitlab-web-ide: $(pkg_vscode_extension_dist_all)
	rm -rf $@
	mkdir -p $@
	cp -r $(pkg_vscode_extension_dist)/* $@

$(pkg_webide_dist_public)/vscode/extensions/gitlab-vscode-theme: $(pkg_vscode_extension_gitlab_vscode_theme_dist_all)
	rm -rf $@
	mkdir -p $@
	cp -r $(pkg_vscode_extension_gitlab_vscode_theme_dist)/* $@

$(pkg_webide_dist_public)/vscode/extensions/gitlab-language-support-vue: $(pkg_vscode_extension_language_support_vue_dist_all)
	rm -rf $@
	mkdir -p $@
	cp -r $(pkg_vscode_extension_language_support_vue_dist)/* $@

$(pkg_webide_dist_public)/assets: $(pkg_webide_assets_all)
	rm -rf $@
	mkdir -p $(dir $@)
	cp -r $(pkg_webide_assets) $@

$(pkg_webide_dist_public)/vscode/extensions/gitlab-vscode-extension: $(pkg_gitlab_vscode_extension_dist_browser)
	rm -rf $@
	mkdir -p $@
	cp -r $(pkg_gitlab_vscode_extension_dist_browser)/* $@

## ================
## vscode-bootstrap
## ================

$(pkg_vscode_bootstrap_dist)/main.js: $(all_ts)
	yarn workspace @gitlab/vscode-bootstrap run build

## ============
## vscode-build
## ============

# what: Let's force this to always run the `yarn workspace` script.
# why: This way `packages/vscode-build` can own whether it needs to rerun or not.
$(pkg_vscode_build_dist)/vscode: FORCE
	yarn workspace @gitlab/vscode-build run build

## =======
## example
## =======
$(pkg_example): $(pkg_example_dist)

$(pkg_example_dist): \
 $(pkg_example_dist)/index.html \
 $(pkg_example_dist)/web-ide/public \
 $(pkg_example_dist)/fonts

# what: We only need to reference the `.html` as the target (the recipe
#       implies the `.js`)
# why: vite builds both the .js and the .html. Referencing a .js as a
#      target might be tricky since the vite compiled .js includes the
#      computed hash in it.
$(pkg_example_dist)/index.html: $(all_src)
	rm -f $@
	yarn build:ts
	yarn workspace @gitlab/example run build

$(pkg_example_dist)/web-ide/public: $(pkg_webide_dist_public_sources)
	rm -rf $@
	mkdir -p $(dir $@)
	cp -r $(pkg_webide_dist_public) $@

$(pkg_example_dist)/fonts: node_modules/@gitlab/fonts/gitlab-mono/GitLabMono.woff2 node_modules/@gitlab/fonts/gitlab-mono/GitLabMono-Italic.woff2
	rm -rf $@
	mkdir $@
	cp -r $^ $@

## ========================
## vscode-extension-web-ide
## ========================
$(pkg_vscode_extension): $(pkg_vscode_extension_dist)

$(pkg_vscode_extension_dist): $(pkg_vscode_extension_dist_all)

$(pkg_vscode_extension_dist)/main.js: $(all_ts)
	rm -f $@
	yarn workspace @gitlab/vscode-extension-web-ide run build

$(pkg_vscode_extension_dist)/%.json: $(pkg_vscode_extension)/vscode.%.json
	rm -f $@
	mkdir -p $(dir $@)
	cp -r $< $@

$(pkg_vscode_extension_dist_assets): $(pkg_vscode_extension_assets_all)
	rm -rf $@
	mkdir -p $(dir $@)
	cp -r $(pkg_vscode_extension)/assets $@

## ========================
## vscode-extension-language-support-vue
## ========================
$(pkg_vscode_extension_language_support_vue): $(pkg_vscode_extension_language_support_vue_dist)

$(pkg_vscode_extension_language_support_vue_dist): $(pkg_vscode_extension_language_support_vue_dist_all)

$(pkg_vscode_extension_language_support_vue_dist)/%.json: $(pkg_vscode_extension_language_support_vue)/vscode.%.json
	rm -f $@
	mkdir -p $(dir $@)
	cp -r $< $@

$(pkg_vscode_extension_language_support_vue_dist_assets): $(pkg_vscode_extension_language_support_vue_dist_assets_all)
	rm -rf $@
	mkdir -p $(dir $@)
	cp -r $(pkg_vscode_extension_language_support_vue)/assets $@

## ========================
## vscode-extension-gitlab-vscode-theme
## ========================
$(pkg_vscode_extension_gitlab_vscode_theme): $(pkg_vscode_extension_gitlab_vscode_theme_dist)

$(pkg_vscode_extension_gitlab_vscode_theme_dist): $(pkg_vscode_extension_gitlab_vscode_theme_dist_all)

$(pkg_vscode_extension_gitlab_vscode_theme_dist)/package.json: $(pkg_vscode_extension_gitlab_vscode_theme)/package.json
	rm -f $@
	mkdir -p $(dir $@)
	cp $< $@

$(pkg_vscode_extension_gitlab_vscode_theme_dist)/%: $(pkg_vscode_extension_gitlab_vscode_theme)/%
	rm -f $@
	mkdir -p $(dir $@)
	cp $< $@

## ========================
## vscode-extension-gitlab-vscode-extension
## ========================
# what: Let's force this to always run the `yarn workspace` script.
# why: This way `packages/gitlab-vscode-extension` can own whether it needs to rerun or not.
$(pkg_gitlab_vscode_extension_dist_browser): FORCE
	yarn workspace @gitlab/gitlab-vscode-extension run build

# what: https://www.gnu.org/software/make/manual/html_node/Force-Targets.html
FORCE:
