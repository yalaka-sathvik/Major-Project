import React from "react";
import Videocall from "./Videocall";
function Meeting() {
  return (
    <>
      <div className="container">
        <div className="row">
          <div className="col-12">
            <Videocall />
          </div>
          {/* <div className="col-6">
            <Chats meetingId={meetingId} username={username} />
          </div> */}
        </div>
      </div>
    </>
  );
}

export default Meeting;
