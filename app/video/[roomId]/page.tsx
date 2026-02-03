import VideoRoomPage from "@modules/video/components/VideoRoomPage";

interface PageProps {
  params: { roomId: string };
}

const VideoRoomRoute = ({ params: { roomId } }: PageProps) => {
  return <VideoRoomPage roomId={roomId} />;
};

export default VideoRoomRoute;
