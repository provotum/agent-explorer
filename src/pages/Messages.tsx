import React from 'react'
import { Avatar, Card, List, Tag, Typography } from 'antd'
import Page from '../layout/Page'
import { format, formatDistanceToNow } from 'date-fns'
import { useQuery } from 'react-query'
import { useVeramo } from '@veramo-community/veramo-react'
import md5 from 'md5'

const { Title } = Typography
const GRAVATAR_URI = 'https://www.gravatar.com/avatar/'

const messageType = (type: string) => {
  switch (type) {
    case 'w3c.vc':
      return 'verifiable credential'
    case 'w3c.vp':
      return 'verifiable presentation'
    case 'sdr':
      return 'SDR'
  }
}

const Messages = () => {
  const { agent } = useVeramo()
  const uri = (did: string) => {
    return GRAVATAR_URI + md5(did) + '?s=200&d=retro'
  }
  const { data: messages } = useQuery(
    ['messages', { agentId: agent?.context.name }],
    () =>
      agent?.dataStoreORMGetMessages({
        order: [{ column: 'createdAt', direction: 'DESC' }],
      }),
  )
  const { data: managedIdentifiers } = useQuery(
    ['managedIdentifiers', { agentId: agent?.context.id }],
    () => agent?.didManagerFind(),
  )
  const isManaged = (did: string) => {
    return managedIdentifiers?.find((i) => i.did === did)
  }

  return (
    <Page header={<Title style={{ fontWeight: 'bold' }}>Activity</Title>}>
      <List
        dataSource={messages}
        renderItem={(item, index) => (
          <Card key={index}>
            <Card.Meta
              avatar={<Avatar size="large" src={uri(item.from || '')} />}
              title={item.from}
              description={
                (isManaged(item.from || '') ? 'Created a ' : 'Received a ') +
                messageType(item.type) +
                ' message • ' +
                formatDistanceToNow(new Date(item.createdAt as string)) +
                ' ago'
              }
            />
            {item?.credentials &&
              item?.credentials.map((vc, index) => {
                return (
                  <Card
                    style={{ marginTop: 20 }}
                    title="Verifiable Credential"
                    key={index}
                  >
                    <Card.Meta
                      style={{ marginBottom: 15 }}
                      title="Issuer"
                      description={vc.issuer.id}
                      avatar={
                        <Avatar size="large" src={uri(vc.issuer.id || '')} />
                      }
                    />
                    <div style={{ marginLeft: 55 }}>
                      <Card.Meta
                        style={{ marginBottom: 15 }}
                        title="Subject"
                        description={
                          <code>
                            <pre>
                              {JSON.stringify(vc.credentialSubject, null, 2)}
                            </pre>
                          </code>
                        }
                      />
                      <Card.Meta
                        style={{ marginBottom: 15 }}
                        title="Issuance Date"
                        description={format(
                          new Date(vc.issuanceDate),
                          'do MMM yyyy',
                        )}
                      />
                      <Card.Meta
                        style={{ marginBottom: 15 }}
                        title="Credential Type"
                        description={vc.type.map((type, index) => (
                          <Tag color="geekblue" key={index}>
                            {type}
                          </Tag>
                        ))}
                      />
                      <Card.Meta
                        style={{ marginBottom: 15 }}
                        title="Proof Type"
                        description={<Tag color="green">{vc.proof.type}</Tag>}
                      />
                    </div>
                  </Card>
                )
              })}
          </Card>
        )}
      />
    </Page>
  )
}

export default Messages
