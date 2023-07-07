import React, { useEffect, useMemo, useState } from "react";
import { Col, FloatingLabel, Form, Row, Stack } from "react-bootstrap";
import { io } from "socket.io-client";

interface payload {
  msg: string;
  user: string;
}

const Chat = (props: any) => {
  const [message, setMessage] = useState("");
  const host = "http://localhost:5000";
  const [data, setData] = useState<payload>({} as payload);
  const socket = io(host);

  const [allMsg, setAllMsg] = useState<payload[]>([]);

  const handleMsg = (e: any) => {
    setMessage(e.target.value);
  };

  const addMsg = (payload: payload) => {
    setAllMsg(allMsg.concat(payload));
  };
  useMemo(() => addMsg(data), [data]);
  const roomid = props.roomid;
  useEffect(() => {
    socket.emit("join-room", roomid);

    socket.on("msg", (payload) => {
      setData(payload);
    });
  });

  const sendMsg = async () => {
    socket.emit("msg", { msg: message, user: props.users[0].name }, roomid);
    setMessage("");
  };
  var oldValue = {};
  return (
    <>
      <Row className="Chatbox" style={{ backgroundColor:"white", margin:"0 0 0 1rem", overflowY:"auto", borderRadius:"2%"}}>
        <Stack>

        {allMsg.map((value, index) => {
          if (JSON.stringify(value) !== JSON.stringify(oldValue)) {
            oldValue = value;
            return (
              <div >
              <p key={index}>
                <span style={{ color: "black", paddingRight: "1rem" }}>
                  {value.user}:
                </span>
                <span style={{color:"#0E2954"}}>

                {value.msg}
                </span>
              </p>
              </div>
            );
          }
        })}
        </Stack>
      </Row>
      <Row style={{alignItems:"center", padding:"1rem 0rem 0 1rem"}}>
        <Col>
          <FloatingLabel
            controlId="floatingInput"
            label="Message"
            style={{
              color: "white",
              
              backgroundColor: "#213555",
            }}
          >
            <Form.Control
              type="text"
              name="msg"
              required
              onChange={handleMsg}
              placeholder="Message"
              style={{ backgroundColor: "#213555", color: "white" }}
              value={message}
            />
          </FloatingLabel>
        </Col>
        <Col xs="auto">
          {/* <button onClick=  {sendMsg}>Send</button> */}
          <button
            type="button"
            style={{ borderColor: "#213555", color: "white" }}
            className="btn"
            onClick={sendMsg}
          >
            Send
          </button>
        </Col>
      </Row>
    </>
  );
};
const MemoizedChatComponent = React.memo(Chat);
export default MemoizedChatComponent;
