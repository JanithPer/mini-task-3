import type { SearchResult } from '@/types'

export const mockResults: SearchResult[] = [
  {
    rank: 1,
    chunk_id: 'r1',
    content:
      'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show that these models are superior in quality while being more parallelizable and requiring significantly less time to train.',
    contextualized_content:
      'This chunk is from the abstract of "Attention Is All You Need" which introduces the Transformer architecture as a novel alternative to recurrent models.',
    score: 0.98,
    document_title: 'Attention Is All You Need',
    arxiv_id: '1706.03762',
    chunk_strategy: 'recursive',
  },
  {
    rank: 2,
    chunk_id: 'r2',
    content:
      'While the Transformer architecture has become the de-facto standard for natural language processing tasks, its applications to computer vision remain limited. In vision, attention is either applied in conjunction with convolutional networks, or used to replace certain components of convolutional networks while keeping their overall structure in place. We show that this reliance on CNNs is not necessary and a pure transformer applied directly to sequences of image patches can perform very well on image classification tasks.',
    contextualized_content: null,
    score: 0.94,
    document_title: 'An Image is Worth 16x16 Words',
    arxiv_id: '2010.11929',
    chunk_strategy: 'recursive',
  },
  {
    rank: 3,
    chunk_id: 'r3',
    content:
      'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
    contextualized_content:
      'This chunk describes the core contribution of the BERT paper: a bidirectional pre-training objective that considers both left and right context simultaneously.',
    score: 0.91,
    document_title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    arxiv_id: '1810.04805',
    chunk_strategy: 'recursive',
  },
]
