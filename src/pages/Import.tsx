import React, { useState } from 'react'
import {
  Alert,
  Button,
  Collapse,
  Form,
  Layout,
  message as alertMessage,
  Modal,
  Result,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  QrcodeOutlined,
  RedoOutlined,
} from '@ant-design/icons'

import Page from '../layout/Page'

import {
  IIdentifier,
  IMessage,
  VerifiableCredential,
  VerifiablePresentation,
} from '@veramo/core'
import { useVeramo } from '@veramo-community/veramo-react'
import DataImport from '../components/standard/DataImport'
import JsonBlock from '../components/standard/Json'
import {
  ICredentialsForSdr,
  ISelectiveDisclosureRequest,
} from '@veramo/selective-disclosure'
import { ICreateVerifiablePresentationArgs } from '@veramo/credential-w3c'
import { useQuery } from 'react-query'
import { ColumnsType } from 'antd/lib/table'
import { format } from 'date-fns'
import QRCode from 'qrcode.react'

const { Title, Text } = Typography
const { Panel } = Collapse

const columns: ColumnsType<VerifiableCredential> = [
  {
    title: 'Issuance Date',
    dataIndex: 'issuanceDate',
    key: 'issuanceDate',
    sorter: {
      compare: (a: any, b: any) =>
        new Date(a.issuanceDate).getTime() - new Date(b.issuanceDate).getTime(),
      multiple: 1,
    },
    render: (a: any) => format(new Date(a), 'PPP'),
  },
  {
    title: 'Issuer',
    dataIndex: 'issuer',
    render: (issuer: any) => issuer.id,
  },
]

const getClaimVerificationExtraIcon = (claim: ICredentialsForSdr) => {
  if (claim.credentials.length > 0) {
    return <CheckCircleOutlined style={{ color: 'green' }} />
  } else {
    return (
      <Space>
        <Tooltip title={claim.issuers?.map((i) => i.did).toString()}>
          <Tag>Requested Issuers</Tag>
        </Tooltip>
        <Text style={{ color: 'red' }}>Missing</Text>
        <CloseCircleOutlined style={{ color: 'red' }} />
      </Space>
    )
  }
}

const isClaimDisabled = (claim: ICredentialsForSdr): boolean =>
  claim.credentials.length > 0 ? false : true

const Import: React.FC = () => {
  const { agent } = useVeramo()

  const { data: identifiers } = useQuery(
    ['identifiers', { agentId: agent?.context.id }],
    () => agent?.dataStoreORMGetIdentifiers(),
  )

  const [message, setMessage] = useState<IMessage | undefined>(undefined)

  const [requiredClaims, setRequiredClaims] = useState<ICredentialsForSdr[]>([])
  const [hasAllRequiredClaims, setHasAllRequiredClaims] = useState(true)
  const [error, setError] = useState('')
  const [jwt, setJwt] = useState('')
  const [isQrMoldalVisible, setIsQrMoldalVisible] = useState(false)
  const [successfulImport, setSuccessfulImport] = useState(false)

  const [
    verifiablePresentationArgs,
    setVerifiablePresentationArgs,
  ] = useState<ICreateVerifiablePresentationArgs>({
    presentation: {
      holder: '',
      verifier: [],
      verifiableCredential: [],
    },
    save: false,
    proofFormat: 'jwt',
  })

  const saveVc = async (credentials: Array<VerifiableCredential>) => {
    console.log(JSON.stringify(credentials))
    for (const credential of credentials) {
      await agent?.dataStoreSaveVerifiableCredential({
        verifiableCredential: credential,
      })
    }
    setSuccessfulImport(true)
  }

  const setHolder = (identifier: string) => {
    setVerifiablePresentationArgs({
      ...verifiablePresentationArgs,
      presentation: {
        ...verifiablePresentationArgs.presentation,
        holder: identifier,
      },
    })
  }

  const rowSelection = {
    onChange: (
      selectedRowKeys: React.Key[],
      selectedRows: VerifiableCredential[],
    ) => {
      setVerifiablePresentationArgs({
        ...verifiablePresentationArgs,
        presentation: {
          ...verifiablePresentationArgs.presentation,
          verifiableCredential: selectedRows.map(
            (row: VerifiableCredential) => row,
          ),
        },
      })
    },
  }

  const isSubmittable = () => {
    return (
      message != undefined &&
      verifiablePresentationArgs.presentation.verifiableCredential.length > 0 &&
      verifiablePresentationArgs.presentation.holder
    )
  }

  const submitVP = async () => {
    const verifiablePresentation:
      | VerifiablePresentation
      | undefined = await agent?.createVerifiablePresentation(
      verifiablePresentationArgs,
    )
    console.log(JSON.stringify(verifiablePresentation?.proof))

    if (verifiablePresentation) {
      setSuccessfulImport(true)
      setJwt(verifiablePresentation.proof.jwt)
    } else {
      setError('Error during VP signing process.')
    }
  }

  const onImportSuccess = async (message: IMessage) => {
    setMessage(message)
    console.log(message.type)

    switch (message.type) {
      case 'w3c.vc':
        break
      case 'sdr':
        try {
          const args = message.data as ISelectiveDisclosureRequest
          const claims:
            | ICredentialsForSdr[]
            | undefined = await agent?.getVerifiableCredentialsForSdr({
            sdr: args,
            did: '',
          })

          if (!message.from) {
            setError('SDR issuer not present')
            return
          }

          // add verifier to VP
          setVerifiablePresentationArgs({
            ...verifiablePresentationArgs,
            presentation: {
              ...verifiablePresentationArgs.presentation,
              verifier: [message.from!],
            },
          })

          if (claims && claims.length > 0) {
            setRequiredClaims(claims)
            claims.map((claim) => {
              if (claim.credentials.length === 0) {
                setHasAllRequiredClaims(false)
              }
            })
          } else {
            setError('Error during scan process')
          }
        } catch (err) {
          console.log(err)
          setError(err.toString())
        }
        break
    }
  }

  const copyToClipBoard = (data: string) => {
    alertMessage.success('Copied to Clipboard')
    navigator.clipboard.writeText(data)
  }

  const getNiceIdentifier = (identifier: Partial<IIdentifier>) => {
    if (!identifier) return
    var shortenedDid = identifier.did

    console.log('asdddd')

    if (identifier.did!.includes('ethr')) {
      console.log('hjeljalsdfjal;ksjl;k')
      const didParts = identifier.did!.split(':')
      var address: string = didParts[didParts.length - 1]
      address = address.slice(0, 6) + '...' + address.slice(-4)
      shortenedDid = ['did', identifier.provider, address].join(':')
    }

    if (identifier.alias) {
      return (
        <>
          <Text strong>{identifier.alias}</Text>{' '}
          <Text>{`(${shortenedDid})`}</Text>
        </>
      )
    }
  }

  return (
    <Page
      header={
        <Layout>
          <Title style={{ fontWeight: 'bold' }}>Import JWT</Title>
        </Layout>
      }
    >
      {message === undefined && <DataImport onSuccess={onImportSuccess} />}
      {error && (
        <Alert
          message="Import Error"
          description={error}
          type="error"
          showIcon
        />
      )}
      {message != undefined && message.type === 'w3c.vc' && !successfulImport && (
        <>
          <JsonBlock title={'preview'} data={message.data} />
          <Button onClick={() => saveVc(message.credentials!)}>Save</Button>
        </>
      )}
      {message != undefined && message.type === 'sdr' && !successfulImport && (
        <>
          <Form.Item>
            <Select
              onSelect={(value: string) => setHolder(value)}
              disabled={!identifiers}
              style={{ width: '100%', height: '100%' }}
            >
              {identifiers?.map((identifier) => {
                return (
                  <Select.Option value={identifier.did!} key={identifier.did!}>
                    {getNiceIdentifier(identifier)}
                  </Select.Option>
                )
              })}
            </Select>
          </Form.Item>
          <Form.Item>
            <Collapse bordered={false} accordion>
              {requiredClaims.map((claim, index) => (
                <Panel
                  header={
                    <>
                      <Tag color="magenta">{claim.credentialContext}</Tag>
                      <Tag color="blue">{claim.credentialType}</Tag>
                      <Tag color="green">{claim.claimType}</Tag>
                    </>
                  }
                  key={index + 1}
                  extra={getClaimVerificationExtraIcon(claim)}
                  disabled={isClaimDisabled(claim)}
                >
                  <Table
                    rowSelection={{ ...rowSelection, type: 'radio' }}
                    expandable={{
                      expandedRowRender: (credentail) => (
                        <pre>
                          {JSON.stringify(
                            credentail.credentialSubject,
                            null,
                            2,
                          )}
                        </pre>
                      ),
                    }}
                    rowKey={(credentail) => JSON.stringify(credentail)}
                    columns={columns}
                    dataSource={claim.credentials}
                    pagination={false}
                  />
                </Panel>
              ))}
              <Panel header="Verifiable Presentation Preview" key="-1">
                <pre>
                  <code>
                    {JSON.stringify(verifiablePresentationArgs, null, 2)}
                  </code>
                </pre>
              </Panel>
            </Collapse>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              disabled={!isSubmittable()}
              onClick={submitVP}
            >
              Create Verifiable Presentation
            </Button>
          </Form.Item>
        </>
      )}

      {successfulImport && !error && (
        <Result
          status="success"
          title="Successful Import"
          extra={[
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={() => copyToClipBoard(jwt)}
              key={'copy'}
              hidden={jwt ? false : true}
            >
              Copy to Clipboard
            </Button>,
            <Button
              type="default"
              icon={<QrcodeOutlined />}
              onClick={() => setIsQrMoldalVisible(true)}
              key={'qr'}
              hidden={jwt ? false : true}
            >
              Show QR Code
            </Button>,
            <Button
              type="primary"
              icon={<RedoOutlined />}
              key={'new'}
              onClick={() => {
                setError('')
                setJwt('')
                setSuccessfulImport(false)
                setMessage(undefined)
              }}
            >
              Import more
            </Button>,
          ]}
        />
      )}

      <Modal
        visible={isQrMoldalVisible}
        onOk={() => setIsQrMoldalVisible(false)}
        onCancel={() => setIsQrMoldalVisible(false)}
      >
        <QRCode
          size={1000}
          style={{ width: '100%', height: '100%' }}
          value={jwt}
        />
      </Modal>
    </Page>
  )
}

export default Import
