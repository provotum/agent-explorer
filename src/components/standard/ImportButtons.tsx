import { Button, Divider, Input, Spin } from 'antd'

import { CopyOutlined, QrcodeOutlined, WifiOutlined } from '@ant-design/icons'
import React from 'react'

const ImportButtonStyle = {
  backgroundColor: 'WhiteSmoke',
  height: '100px',
}

export const ImportButtons: React.FC<{
  loading: boolean
  useCamera: () => void
  useNfc: () => void
  handleClipboard: (data: string) => void
}> = ({ loading, useCamera, useNfc, handleClipboard }) => {
  return (
    <Spin spinning={loading}>
      <Button
        type={'dashed'}
        onClick={useCamera}
        icon={<QrcodeOutlined />}
        block
        style={ImportButtonStyle}
        disabled={loading}
      >
        Scan QR Code
      </Button>
      <Divider />
      <Button
        type={'dashed'}
        onClick={useNfc}
        icon={<WifiOutlined />}
        block
        style={ImportButtonStyle}
        disabled={loading}
      >
        Scan NFC Tag
      </Button>
      <Divider />
      <Input
        size="large"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleClipboard(e.target.value)
        }
        addonBefore={<CopyOutlined />}
        disabled={loading}
        placeholder={'Paste JWT manually'}
      />
    </Spin>
  )
}
