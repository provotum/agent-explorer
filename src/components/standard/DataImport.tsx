import React, { useState } from 'react'
import { Alert, Button, Modal } from 'antd'

import { ImportButtons } from './ImportButtons'
import QrReader from 'react-qr-reader'
import { useVeramo } from '@veramo-community/veramo-react'
import { IMessage } from '@veramo/core'

const DataImport: React.FC<{
  onSuccess: (message: IMessage) => void
  hidden?: boolean
}> = ({ onSuccess, hidden = false }) => {
  const { agent } = useVeramo()
  const [loading, setLoading] = useState(false)
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false)
  const [isNfcModalVisible, setIsNfcModalVisible] = useState(false)
  const [importError, setImportError] = useState('')

  const handleQrScan = async (data: any) => {
    if (data) {
      setLoading(true)
      setIsCameraModalVisible(false)
      try {
        await handleImport(data)
      } catch (err) {
        setImportError(err.toString())
      }
      setLoading(false)
    }
  }

  const handleClipboard = async (data: string) => {
    setLoading(true)
    try {
      await handleImport(data)
    } catch (err) {
      console.log(err)
      setImportError(err.toString())
    }
    setLoading(false)
  }

  const handleImport = async (jwt: string) => {
    let message: IMessage | undefined = undefined
    try {
      message = await agent?.handleMessage({
        raw: jwt,
        save: true,
      })
      onSuccess(message!)
    } catch (err) {
      setImportError('Import Error: Bad JWT token. ' + err.toString())
    }
  }

  return (
    <>
      {!hidden && (
        <>
          {!importError && (
            <ImportButtons
              loading={loading}
              useCamera={() => setIsCameraModalVisible(true)}
              useNfc={() => setIsNfcModalVisible(true)}
              handleClipboard={handleClipboard}
            />
          )}
          {isCameraModalVisible && ( // necessary to kill camera window
            <Modal
              visible={isCameraModalVisible}
              onCancel={() => setIsCameraModalVisible(false)}
              footer={[
                <Button
                  key="cancel"
                  onClick={() => setIsCameraModalVisible(false)}
                >
                  Cancel
                </Button>,
              ]}
            >
              <QrReader
                delay={100}
                style={{
                  height: '100%',
                  width: '100%',
                }}
                onError={(err) => setImportError(err.toString())}
                onScan={handleQrScan}
              />
            </Modal>
          )}

          <Modal
            visible={isNfcModalVisible}
            onCancel={() => setIsNfcModalVisible(false)}
            footer={[
              <Button key="cancel" onClick={() => setIsNfcModalVisible(false)}>
                Cancel
              </Button>,
            ]}
          >
            <div>coming soon...</div>
          </Modal>

          {importError && (
            <Alert
              message="Import Error"
              description={importError}
              type="error"
              showIcon
              action={
                <Button size="small" onClick={() => setImportError('')}>
                  Retry Import
                </Button>
              }
            />
          )}
        </>
      )}
    </>
  )
}

export default DataImport
