dist=dist
dist_vscode_tar=$(dist)/vscode-web.tar.gz
dist_vscode_dir=$(dist)/vscode

# what: If we don't have a vscode_version.local.json, use the one in source control
ifeq (,$(wildcard vscode_version.local.json))
  vscode_version_json=vscode_version.json
else
  vscode_version_json=vscode_version.local.json
endif
vscode_type=$(shell node -p -e 'require("./$(vscode_version_json)").type')
vscode_location=$(shell node -p -e 'require("./$(vscode_version_json)").location')

# what: No matter what the vscode version "type" is, we always run this before the main recipe
.before:
	rm -rf $(dist_vscode_dir)
	mkdir -p $(dist)

# what: No matter what the vscode version "type" is, we always run this after the main recipe
.after:
# why: This blocks ability to publish https://gitlab.com/gitlab-org/gitlab-web-ide/-/issues/3#note_1058971918
	rm -rf $(dist_vscode_dir)/node_modules/.bin
	# Touch so that we consider this "updated" for Makefile's calc
	touch $(dist_vscode_dir)

# ============
# region: type === path
# ============
ifeq ($(vscode_type),path)

# what: We are in 'path' mode, so the 'dist/vscode' depends on the actual 'location' on disk.
$(dist_vscode_dir): $(vscode_location)
	make .before
	cp -r $(vscode_location) $(dist_vscode_dir)
	make .after

# what: Make the vscode 'location' depend on our local vscode_version.local.json
# why: This way we can simply touch our vscode_version.local.json and it will trigger rebuilding
$(vscode_location): $(vscode_version_json)
	touch $(vscode_location)

# ============
# region: type === url
# ============
else ifeq ($(vscode_type),url)

# what: We are in 'url' mode, so the 'dist/vscode' depends on a tarball we'll download form the vscode version metadata "location"
$(dist_vscode_dir): $(dist_vscode_tar)
	make .before
	mkdir -p $(dist_vscode_dir)
	tar -xzf $(dist_vscode_tar) -C $(dist_vscode_dir) --strip-components 1
	make .after

$(dist_vscode_tar): $(vscode_version_json)
	mkdir -p $(dist)
	rm -rf $(dist_vscode_tar)
	curl $(vscode_location) --output $(dist_vscode_tar)

endif
