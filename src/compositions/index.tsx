import { useVideoConfig } from 'remotion';
import { useCurrentFrame } from 'remotion';
import { interpolate } from 'remotion';
import {
  Composition,
  Sequence,
  AbsoluteFill,
  staticFile,
  Video,
} from 'remotion';
import { IntroSwarm } from './introSwarm';
import SESSIONS from '../../public/json/sessions.json';
import { Session as SessionType } from '../types';

const sessions: SessionType[] = SESSIONS.data;
const FPS = 25;

interface Props {
  session: SessionType;
}

const IntroSwarmWithVideo: React.FC<Props> = ({ session }) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  // Start fading to black and audio 50 frames before the end of the video
  const startFadeFrame = durationInFrames - 50;

  // Calculate opacity and volume for the current frame
  const opacity = interpolate(
    frame,
    [startFadeFrame, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  const volume = interpolate(
    frame,
    [startFadeFrame, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  return (
    <div>
      <Sequence name="Video" from={150}>
        <Video
          src={staticFile(session.videoPath)}
          startFrom={session.startCut * FPS}
          endAt={session.endCut * FPS}
          volume={() => volume}
        />
      </Sequence>
      <Sequence durationInFrames={175}>
        <IntroSwarm session={session} />
      </Sequence>
      <AbsoluteFill style={{ backgroundColor: 'black', opacity }} />
    </div>
  );
};

export function Compositions() {
  const defaultAvatarUrl = staticFile('/images/ETHLogo.jpg');
  const processedSessions = sessions
    .filter(
      (session) =>
        session.speakers &&
        session.speakers.length > 0 &&
        session.videoPath &&
        session.startCut &&
        session.endCut,
    )
    .map((session) => {
      if (session.speakers) {
        session.speakers.forEach((speaker) => {
          if (speaker.avatarUrl === null) {
            speaker.avatarUrl = defaultAvatarUrl;
            console.warn(`${session.id} has no avatar, changing it to default`);
          }
        });
      }
      return session;
    });

  return (
    <>
      {processedSessions.map((session, index) => (
        <Composition
          key={index}
          id={`session-${session.id}`}
          component={IntroSwarmWithVideo}
          width={1920}
          height={1080}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          durationInFrames={session.endCut * FPS - session.startCut * FPS}
          fps={FPS}
          defaultProps={{ session }}
        />
      ))}
    </>
  );
}
