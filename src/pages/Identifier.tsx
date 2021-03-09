import React from 'react'
import { Typography, Card, Layout } from 'antd'
import Page from '../layout/Page'
import { useParams } from 'react-router-dom'
import DidData from '../components/modules/Identifier'
// import Collectibles from '../components/modules/Collectibles'
import Nft from '../components/modules/Nft'

const { Title } = Typography

const Identifier = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <Page
      header={
        <Layout>
          <Title style={{ fontWeight: 'bold' }}>Identifier</Title>
          <code>{id}</code>
        </Layout>
      }
    >
      {/* <Collectibles account={id.split(':').pop() || ''} /> */}

      {id.substr(0,7)==='did:nft' && <Nft address={id.split(':')[3]} tokenId={id.split(':')[4]} />}
      
      <DidData identifier={id} cacheKey={id} title="Data" />
      
      <Card style={{ height: 400 }} loading>
        Card 1
      </Card>
      <Card style={{ height: 400 }} loading>
        Card 1
      </Card>
      <Card style={{ height: 400 }} loading>
        Card 1
      </Card>
      <Card style={{ height: 400 }} loading>
        Card 1
      </Card>
      <Card style={{ height: 400 }} loading>
        Card 1
      </Card>
      <Card style={{ height: 400 }} loading>
        Card 1
      </Card>
      <Card style={{ height: 400 }} loading>
        Card 1
      </Card>
      <Card style={{ height: 400 }} loading>
        Card 1
      </Card>
    </Page>
  )
}

export default Identifier
