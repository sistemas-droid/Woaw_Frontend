# ios/App/xcodeproj_object_version_70_patch.rb
require 'xcodeproj'

module Xcodeproj
  module Constants
    # Agrega el mapeo que falta para objectVersion 70 (Xcode 16/26)
    OBJECT_VERSION_TO_COMPATIBILITY_VERSION[70] = 'Xcode 16.0'
    COMPATIBILITY_VERSION_TO_OBJECT_VERSION['Xcode 16.0'] = 70

    # (Opcional) Si tu entorno fuerza 70 como default, puedes bajar el default:
    # remove_const(:DEFAULT_OBJECT_VERSION) if const_defined?(:DEFAULT_OBJECT_VERSION)
    # DEFAULT_OBJECT_VERSION = 60  # 60/61 funcionan bien con CocoaPods actuales
  end
end