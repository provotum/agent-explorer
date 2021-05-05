import React, { useEffect, useState } from 'react'
import {
  Button,
  Cascader,
  Col,
  Collapse,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Result,
  Row,
  Select,
  Spin,
  Typography,
} from 'antd'
import { useQuery } from 'react-query'
import { useVeramo } from '@veramo-community/veramo-react'
import { CopyOutlined, QrcodeOutlined, RedoOutlined } from '@ant-design/icons'
import QRCode from 'qrcode.react'
import { ICreateVerifiableCredentialArgs } from '@veramo/credential-w3c'
import { VerifiableCredential } from '@veramo/core'
import { DataType, schemas } from 'provotum-ssi-utils'

const { Panel } = Collapse

const defaultArgs: ICreateVerifiableCredentialArgs = {
  credential: {
    issuer: { id: '' },
    credentialSubject: {
      id: '',
    },
  },
  proofFormat: 'jwt',
}

const CreateCredential: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [isQRCodeModalVisible, setIsQRCodeModalVisible] = useState(false)
  const [vcJwt, setVcJwt] = useState('')
  const [claimKey, setClaimKey] = useState('')
  const [dataType, setDataType] = useState<DataType | undefined>(undefined)
  const [signedVc, setSignedVc] = useState<VerifiableCredential | undefined>(
    undefined,
  )
  const [subject, setSubject] = useState(
    'did:web:uzh-veramo-cloud-agent.herokuapp.com',
  )
  const [issuer, setIssuer] = useState('')
  const [context, setContext] = useState('')
  const [type, setType] = useState('')
  const [value, setValue] = useState<string | boolean>('')

  useEffect(() => {
    console.log(claimKey)
    console.log(value)

    let credentialSubject
    if (claimKey) credentialSubject = { id: issuer, [claimKey]: value }
    else credentialSubject = { id: issuer }

    setCreateCredentialArgs({
      credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1', context],
        type: ['VerifiableCredential', type],
        issuer: { id: issuer },
        credentialSubject,
      },
      save: false,
      proofFormat: 'jwt',
    })
  }, [subject, issuer, context, type, value, claimKey, signedVc])

  const [createCredentialArgs, setCreateCredentialArgs] = useState(defaultArgs)

  const { agent } = useVeramo()
  const { data: identifiers } = useQuery(
    ['identifiers', { agentId: agent?.context.id }],
    () => agent?.dataStoreORMGetIdentifiers(),
  )

  const sign = async () => {
    setLoading(true)
    const signedVC = await agent?.createVerifiableCredential(
      createCredentialArgs,
    )

    console.log(JSON.stringify(signedVC))

    setSignedVc(signedVC)
    setLoading(false)
    setVcJwt(signedVC?.proof.jwt)
    message.success('VC signed!')
  }

  const copyToClipBoard = (data: string) => {
    message.success('Copied to Clipboard')
    navigator.clipboard.writeText(data)
  }

  const showQRCodeModal = () => {
    setIsQRCodeModalVisible(true)
  }

  const closeQRCodeModal = () => {
    setIsQRCodeModalVisible(false)
  }

  const reset = () => {
    setLoading(false)
    setIsQRCodeModalVisible(false)
    setVcJwt('')
    setClaimKey('')
    setDataType(undefined)
    setSignedVc(undefined)
    setSubject('')
    setIssuer('')
    setContext('')
    setType('')
    setValue('')
  }

  const getDataTypeInput = () => {
    if (dataType === 'DATE') {
      return (
        <DatePicker
          onChange={(_, dateString: string) => setValue(dateString)}
          disabled={claimKey === ''}
        />
      )
    } else if (dataType === 'BOOLEAN') {
      return (
        <Select onSelect={(value: string) => setValue(value === 'true')}>
          <Select.Option value="true">is true</Select.Option>
          <Select.Option value="false">is false</Select.Option>
        </Select>
      )
    } else {
      return (
        <Input
          value={value as string}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setValue(e.target.value)
          }
          disabled={claimKey === ''}
        />
      )
    }
  }

  const isSignable = issuer && type && claimKey

  return (
    <Spin spinning={loading}>
      {!signedVc && (
        <>
          <Form layout="vertical">
            <Form.Item label="Subject" required>
              <Input
                name="subject"
                value={subject}
                placeholder={'Paste the DID of the subject here'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSubject(e.target.value)
                }
              />
            </Form.Item>
            <Form.Item label="Issuer" required>
              <Select
                onSelect={(value: string) => setIssuer(value)}
                disabled={!identifiers}
              >
                {identifiers?.map((identifier, index) => (
                  <Select.Option value={identifier.did!} key={index}>
                    {identifier.did!}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Claim" required>
              <Row gutter={8}>
                <Col span={12}>
                  <Cascader
                    // value={selectedContextOptions}
                    style={{ width: '100%' }}
                    options={schemas}
                    fieldNames={{
                      label: 'key',
                      value: 'key',
                      children: 'children',
                    }}
                    onChange={(_, options) => {
                      if (options) {
                        setContext(options[0]['key'])
                        setType(options[options.length - 2]['key'])
                        setClaimKey(options[options.length - 1]['key'])
                        setDataType(
                          options[options.length - 1]['dataType'] as DataType,
                        )
                      }
                    }}
                    placeholder="Please select the context"
                  />
                </Col>
                <Col span={12}>{getDataTypeInput()}</Col>
              </Row>
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={sign} disabled={!isSignable}>
                Sign and Issue
              </Button>
            </Form.Item>
          </Form>
        </>
      )}
      {signedVc && (
        <>
          <Result
            status="success"
            title="Successfully created signed Verifiable Credential!"
            subTitle={`Send this JSON to the subject with the DID: ${signedVc.id}`}
            extra={[
              <Button
                type="link"
                icon={<CopyOutlined />}
                onClick={() => copyToClipBoard(vcJwt)}
                key={'copy'}
              >
                Copy to Clipboard
              </Button>,
              <Button
                type="default"
                icon={<QrcodeOutlined />}
                onClick={showQRCodeModal}
                key={'qr'}
              >
                Show QR Code
              </Button>,
              <Button
                type="primary"
                icon={<RedoOutlined />}
                key={'new'}
                onClick={reset}
              >
                Create new Credentials
              </Button>,
            ]}
          />
          <Modal
            title="Signed Verifiable Credential"
            visible={isQRCodeModalVisible}
            onOk={closeQRCodeModal}
            onCancel={closeQRCodeModal}
          >
            <QRCode size={400} value={vcJwt} />
          </Modal>
        </>
      )}
      {!signedVc && (
        <Collapse>
          <Panel key={1} header="Preview">
            <code>
              <pre>
                {createCredentialArgs &&
                  JSON.stringify(createCredentialArgs, null, 2)}
              </pre>
            </code>
          </Panel>
        </Collapse>
      )}
    </Spin>
  )
}

export default CreateCredential
