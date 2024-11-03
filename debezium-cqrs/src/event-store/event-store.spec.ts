import { nextSequenceNumber } from './event-store';

describe('nextSequenceNumber', () => {
  it('イベントのうち最大のシーケンスNoに1を足した値が返される', () => {
    expect(
      nextSequenceNumber(
        [
          {
            sequenceNumber: 1,
          },
        ],
        {
          sequenceNumber: 1,
        },
      ),
    ).toBe(2);

    expect(
      nextSequenceNumber(
        [
          {
            sequenceNumber: 1,
          },
          {
            sequenceNumber: 2,
          },
        ],
        {
          sequenceNumber: 1,
        },
      ),
    ).toBe(3);
  });

  it('イベントが空の時は snapshot のシーケンスNoに1を足した値が返される', () => {
    expect(
      nextSequenceNumber([], {
        sequenceNumber: 1,
      }),
    ).toBe(2);

    expect(
      nextSequenceNumber([], {
        sequenceNumber: 100,
      }),
    ).toBe(101);
  });
});
