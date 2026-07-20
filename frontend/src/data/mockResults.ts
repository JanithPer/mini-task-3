import type { SearchResult } from '@/types'

export const mockResults: SearchResult[] = [
  {
    id: 'r1',
    rank: 1,
    title: 'Attention Is All You Need',
    relevance: 0.98,
    snippet:
      'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer...',
    arxivId: '1706.03762',
    chunking: 'recursive',
    contextualized: true,
  },
  {
    id: 'r2',
    rank: 2,
    title: 'An Image is Worth 16×16 Words',
    relevance: 0.94,
    snippet:
      'While the Transformer architecture has become the de-facto standard for natural language processing tasks, its applications to computer vision remain limited. In vision, attention is either applied in conjunction with convolutional networks, or used to replace certain components...',
    arxivId: '2010.11929',
    chunking: 'recursive',
    contextualized: true,
  },
  {
    id: 'r3',
    rank: 3,
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    relevance: 0.91,
    snippet:
      'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text...',
    arxivId: '1810.04805',
    chunking: 'recursive',
    contextualized: true,
  },
]
