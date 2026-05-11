; Custom code to create AppData folder on install
!macro customInstall
  SetShellVarContext current
  StrCpy $0 "$APPDATA\Mr. DIY - LOCAL\data"
  
  ; Create the data folder if it doesn't exist
  IfFileExists "$0" skip_create
    CreateDirectory "$0"
    DetailPrint "Created data folder: $0"
  
  skip_create:
!macroend

; Custom code to delete AppData on uninstall
!macro customUninstall
  SetShellVarContext current
  
  ; Delete from AppData\Roaming
  StrCpy $0 "$APPDATA\Mr. DIY - LOCAL"
  IfFileExists "$0\*.*" 0 skip_roaming
    RMDir /r "$0"
    DetailPrint "Application data removed from Roaming: $0"
  skip_roaming:
  
  ; Delete from AppData\Local
  StrCpy $0 "$LOCALAPPDATA\Mr. DIY - LOCAL"
  IfFileExists "$0\*.*" 0 skip_local
    RMDir /r "$0"
    DetailPrint "Application data removed from Local: $0"
  skip_local:
  
  ; Delete from AppData\LocalLow
  StrCpy $0 "$PROFILE\AppData\LocalLow\Mr. DIY - LOCAL"
  IfFileExists "$0\*.*" 0 skip_locallow
    RMDir /r "$0"
    DetailPrint "Application data removed from LocalLow: $0"
  skip_locallow:
!macroend
