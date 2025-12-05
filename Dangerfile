# frozen_string_literal: true

require 'gitlab-dangerfiles'

Gitlab::Dangerfiles.for_project(self, 'gitlab-web-ide') do |dangerfiles|
  dangerfiles.import_plugins
  dangerfiles.import_dangerfiles(only: %w[simple_roulette])
end

