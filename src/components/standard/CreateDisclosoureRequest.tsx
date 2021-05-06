import React, { useEffect, useState } from 'react'
import {
  Button,
  Cascader,
  Checkbox,
  Col,
  Collapse,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import {
  CloseCircleOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useVeramo } from '@veramo-community/veramo-react'
import { useQuery, useQueryClient } from 'react-query'
import {
  ICreateSelectiveDisclosureRequestArgs,
  ICredentialRequestInput,
  Issuer,
} from '@veramo/selective-disclosure'
import { schemas } from 'provotum-ssi-utils'
import { CascaderValueType } from 'antd/es/cascader'

const { Panel } = Collapse
const { Text } = Typography
const { TextArea } = Input

interface CreateRequestProps {}

const defaultArgs: ICreateSelectiveDisclosureRequestArgs = {
  data: {
    issuer: '',
    claims: [],
    subject: '',
  },
}

const CreateDisclosureRequest: React.FC<CreateRequestProps> = ({}) => {
  const { agent } = useVeramo()
  const query = useQueryClient()
  const [createSdrArgs, setCreateSdrArgs] = useState(defaultArgs)
  const [loading, setLoading] = useState<boolean>(false)
  const [subject, setSubject] = useState<string>('')
  const [issuer, setIssuer] = useState<string>('')
  const [claimType, setClaimType] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [essential, setEssential] = useState<boolean>(false)
  const [replyUrl, setReplyUrl] = useState<string>()
  const [tag, setTag] = useState<string>('')
  const [issuers, setIssuers] = useState<Issuer[]>([])
  const [credentialContext, setCredentialContext] = useState<string>('')
  const [credentialType, setCredentialType] = useState<string>('')
  const [cascader, setCascader] = useState<CascaderValueType>()

  const [claims, setClaims] = useState<ICredentialRequestInput[]>([])
  const { data: identifiers, isLoading: identifiersLoading } = useQuery(
    ['identifiers', { agentId: agent?.context.id }],
    () => agent?.didManagerFind(),
  )
  const [panelOpen, setPanelOpen] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const cleanedSdrArgs = (): ICreateSelectiveDisclosureRequestArgs => {
    const sdrArgs: ICreateSelectiveDisclosureRequestArgs = {
      data: {
        issuer,
        claims,
      },
    }
    if (subject) sdrArgs.data.subject = subject
    if (tag) sdrArgs.data.tag = tag

    return sdrArgs
  }

  const createSDR = async () => {
    setLoading(true)
    const args = cleanedSdrArgs()
    const request = await agent?.createSelectiveDisclosureRequest(args)

    if (request) {
      await agent?.handleMessage({ raw: request, save: true })
      query.invalidateQueries(['requests'])
    }

    if (args.data.issuer && request) {
      try {
        await agent?.sendMessageDIDCommAlpha1({
          data: {
            to: args.data.subject as string,
            from: args.data.issuer as string,
            type: 'jwt',
            body: request,
          },
        })
      } catch (err) {
        console.log(err)
      }
    }
    resetClaim()
    resetForm()
    setLoading(false)
  }

  const resetForm = () => {
    setCreateSdrArgs(defaultArgs)
    setLoading(false)
    setSubject('')
    setReplyUrl('')
    setTag('')
    setClaims([])
    setIssuer('')
  }

  const resetClaim = () => {
    setClaimType('')
    setReason('')
    setEssential(false)
    setIssuers([])
    setCredentialType('')
    setCredentialContext('')
    setCascader(undefined)
  }

  const addClaim = () => {
    setIsModalVisible(false)
    setClaims([...claims, getClaim()])
    resetClaim()
  }

  const getArgs = (): ICreateSelectiveDisclosureRequestArgs => {
    let args = defaultArgs
    return args
  }

  const getClaims = (): ICredentialRequestInput[] => {
    let shortClaims: ICredentialRequestInput[] = []
    for (const claim in claims) {
      const newClaim = Object.entries(claim).filter((field: any) => field)
      shortClaims.push((newClaim as unknown) as ICredentialRequestInput)
    }
    return shortClaims
  }

  const getCleanedClaim = () => {
    let cleaned = {}
    for (const [key, value] of Object.entries(getClaim())) {
      // @ts-ignore
      cleaned[key] = value
    }
    return cleaned
  }

  const addIssuer = () => {
    setIssuers([...issuers, { did: '', url: '' }])
  }

  const removeIssuer = (index: number) => {
    let copy = [...issuers]
    if (index !== -1) {
      copy.splice(index, 1)
      setIssuers(copy)
    }
  }
  const deleteClaim = (index: number) => {
    let copy = [...claims]
    if (index !== -1) {
      copy.splice(index, 1)
      setClaims(copy)
    }
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    resetClaim()
  }

  const addIssuerDid = (did: string, index: number) => {
    let copy = [...issuers]
    copy[index].did = did
    setIssuers(copy)
  }

  const addIssuerUrl = (url: string, index: number) => {
    let copy = [...issuers]
    copy[index].url = url
    setIssuers(copy)
  }

  useEffect(() => {
    setCreateSdrArgs({
      data: {
        issuer,
        subject,
        replyUrl,
        tag,
        claims,
      },
    })
  }, [
    subject,
    issuers,
    tag,
    issuer,
    claimType,
    reason,
    essential,
    replyUrl,
    claims,
  ])

  const handleClaimType = (value: CascaderValueType) => {
    setClaimType(value[value.length - 1] as string)
    setCredentialContext(value[0] as string)
    setCredentialType(value[value.length - 2] as string)
    setCascader(value)
  }

  const getClaim = () => ({
    credentialContext,
    credentialType,
    claimType,
    essential,
    issuers,
    reason,
  })

  const AddClaimForm = (
    <Form layout="vertical">
      <Form.Item label={'Claim Context (Type)'} required>
        <Cascader
          value={cascader}
          style={{ width: '100%' }}
          options={schemas}
          fieldNames={{
            label: 'key',
            value: 'key',
            children: 'children',
          }}
          onChange={(value, selectedOptions) => handleClaimType(value)}
          placeholder="Please select the context"
        />
      </Form.Item>
      <Form.Item label="Accepted Issuers">
        {issuers.map((issuer, index) => (
          <Row key={index} align="middle" style={{ paddingBottom: '20px' }}>
            <Col flex={'auto'}>
              <Form.Item noStyle>
                <Input
                  value={issuer.did}
                  placeholder="DID"
                  onChange={(e) => addIssuerDid(e.target.value, index)}
                />
              </Form.Item>
            </Col>
            <Col flex={'auto'} style={{ paddingRight: 10, paddingLeft: 10 }}>
              <Form.Item noStyle>
                <Input
                  value={issuer.url}
                  placeholder="URL"
                  onChange={(e) => addIssuerUrl(e.target.value, index)}
                />
              </Form.Item>
            </Col>
            <Col>
              <Button
                type={'text'}
                shape={'round'}
                onClick={() => {
                  removeIssuer(index)
                }}
                style={{
                  color: 'red',
                }}
              >
                <CloseCircleOutlined />
              </Button>
            </Col>
          </Row>
        ))}
        <div>
          <Button
            type="dashed"
            onClick={() => addIssuer()}
            block
            icon={<PlusOutlined />}
          >
            Add a Trusted Issuer
          </Button>
        </div>
      </Form.Item>
      <Form.Item label={'Reason'}>
        <TextArea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="State a reason why this claim must be disclosed"
          autoSize={{ minRows: 3, maxRows: 5 }}
        />
      </Form.Item>

      <Collapse>
        <Panel key={1} header={'Preview Claim'}>
          <code>
            <pre>{getClaim() && JSON.stringify(getClaim(), null, 2)}</pre>
          </code>
        </Panel>
      </Collapse>
    </Form>
  )

  return (
    <Spin spinning={loading}>
      <Collapse>
        <Panel key={1} header={'Create Selective Disclosure Request'}>
          <Form layout="vertical">
            <Form.Item label="SRD Issuer" required>
              <Select
                onSelect={(value: string) => setIssuer(value)}
                disabled={!identifiers}
                allowClear
              >
                {identifiers?.map((identifier, index) => (
                  <Select.Option value={identifier.did!} key={index}>
                    {identifier.did!}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label={'Subject'}>
              <Input
                placeholder={'DID of the subject'}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Form.Item>
            <Form.Item label={'Tag'}>
              <Input
                placeholder={'Set a tag'}
                onChange={(e) => setTag(e.target.value)}
              />
            </Form.Item>
            <Form.Item required label={'Claims'}>
              {createSdrArgs.data.claims &&
                createSdrArgs.data.claims.map((claim, index) => (
                  <div key={index} style={{ paddingBottom: '7px' }}>
                    <Row>
                      <Col>
                        <Space>
                          <Tag color="magenta">{claim.credentialContext}</Tag>
                          <Tag color="blue">{claim.credentialType}</Tag>
                          <Tag color="green">{claim.claimType}</Tag>
                        </Space>
                      </Col>
                      <Col flex="auto"></Col>
                      <Col>
                        <MinusCircleOutlined
                          onClick={() => deleteClaim(index)}
                        />
                      </Col>
                    </Row>
                  </div>
                ))}
              <Button
                type="dashed"
                onClick={() => setIsModalVisible(true)}
                block
                icon={<PlusOutlined />}
              >
                Add Claim
              </Button>
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                onClick={() => createSDR()}
                disabled={
                  createSdrArgs.data.claims.length === 0 ||
                  !createSdrArgs.data.issuer
                }
              >
                Create SDR
              </Button>
            </Form.Item>
            <Modal
              visible={isModalVisible}
              onCancel={handleCancel}
              width={700}
              footer={[
                <Checkbox onChange={(e) => setEssential(e.target.checked)}>
                  essential
                </Checkbox>,
                <Button
                  key="back"
                  type="primary"
                  onClick={addClaim}
                  disabled={!credentialContext && !credentialType && !claimType}
                >
                  Add Claim
                </Button>,
              ]}
            >
              {AddClaimForm}
            </Modal>
          </Form>

          <Collapse>
            <Panel key={1} header={'Preview'}>
              <code>
                <pre>
                  {cleanedSdrArgs() &&
                    JSON.stringify(cleanedSdrArgs(), null, 2)}
                </pre>
              </code>
            </Panel>
          </Collapse>
        </Panel>
      </Collapse>
    </Spin>
  )
}

export default CreateDisclosureRequest
