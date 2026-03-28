 import React, { useState } from "react";

import Navbar from "./Navbar";

import {

  Container,

  Grid,

  Card,

  CardContent,

  CardActions,

  Typography,

  Button,

  Dialog,

  DialogTitle,

  DialogContent,

  DialogActions,

  TextField,

  Box,

  Fade

} from '@mui/material';

import { useNavigate } from "react-router-dom";

import api from "../utils/api";

function LandingPage() {

  const [meetingId, setMeetingId] = useState("");

  const [username, setUsername ] = useState("");

  const [message, setMessage ] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  const [joinOpen, setJoinOpen] = useState(false);

  const navigate = useNavigate();

  const userFound = localStorage.getItem("token");

  async function handleCreate(isCreating) {

    setCreateOpen(false);

    try {

      if (!userFound) {

        setMessage("Sign in to create a meeting");

        return;

      }

      const res = await api.post("check-meeting", {

        meetingId,

      });

      if (res.data.exists) {

        setMessage("Meeting ID already in use. Please choose a different one.");

        return;

      }

      navigate("/preview", {

        state: {

          meetingId,

          username,

          isCreating,

        },

      });

    } catch (err) {

      console.log(err);

      setMessage("Error creating meeting");

    }

  }

  function handleJoin(isCreating) {

    setJoinOpen(false);

    if (!userFound) {

      setMessage("Sign in or login to join a meeting");

      return;

    }
    if (!meetingId.trim()) {
      setMessage("Please enter a valid meeting ID");
      return;
    }

    navigate("/preview", {

      state: {

        meetingId: meetingId.trim(),

        username,

        isCreating,

      },

    });

  }

  return (

    <>

      <Navbar />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

        <Box sx={{ textAlign: 'center', mb: 6 }}>

          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>

            PopMeet

          </Typography>

          <Typography variant="h5" color="text.secondary" paragraph>

            Where Conversations Drive Impact

          </Typography>

          <Typography variant="body1" color="text.secondary" maxWidth="600px" mx="auto">

            Your unified platform for secure, high-quality virtual meetings and meaningful connections — anytime, anywhere.

          </Typography>

        </Box>

        <Grid container spacing={4} justifyContent="center">

          <Grid item xs={12} sm={6} md={3}>

            <Card sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-8px)' } }}>

              <CardContent>

                <Typography variant="h6" gutterBottom fontWeight="bold">

                  Create A Meeting

                </Typography>

                <Typography variant="body2" color="text.secondary">

                  Create your own instant meeting

                </Typography>

              </CardContent>

              <CardActions>

                <Button 

                  fullWidth 

                  variant="contained" 

                  color="primary"

                  onClick={() => setCreateOpen(true)}

                >

                  Create Now

                </Button>

              </CardActions>

            </Card>

          </Grid>

          <Grid item xs={12} sm={6} md={3}>

            <Card sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-8px)' } }}>

              <CardContent>

                <Typography variant="h6" gutterBottom fontWeight="bold">

                  Join A Meeting

                </Typography>

                <Typography variant="body2" color="text.secondary">

                  Join a meeting quickly using meeting ID

                </Typography>

              </CardContent>

              <CardActions>

                <Button 

                  fullWidth 

                  variant="contained" 

                  color="secondary"

                  onClick={() => setJoinOpen(true)}

                >

                  Join Now

                </Button>

              </CardActions>

            </Card>

          </Grid>

          <Grid item xs={12} sm={6} md={3}>

            <Card sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-8px)' } }}>

              <CardContent>

                <Typography variant="h6" gutterBottom fontWeight="bold">

                  Past Meetings

                </Typography>

                <Typography variant="body2" color="text.secondary">

                  Check your past meetings history

                </Typography>

              </CardContent>

              <CardActions>

                <Button 

                  fullWidth 

                  variant="contained"

                  href="/past-meetings"

                >

                  View History

                </Button>

              </CardActions>

            </Card>

          </Grid>

          <Grid item xs={12} sm={6} md={3}>

            <Card sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-8px)' } }}>

              <CardContent>

                <Typography variant="h6" gutterBottom fontWeight="bold">

                  Edit Profile

                </Typography>

                <Typography variant="body2" color="text.secondary">

                  Edit and view your profile data

                </Typography>

              </CardContent>

              <CardActions>

                <Button 

                  fullWidth 

                  variant="contained"

                  href="/profile"

                >

                  Edit Profile

                </Button>

              </CardActions>

            </Card>

          </Grid>

        </Grid>

      </Container>

      {/* Create Dialog */}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>

        <Fade in={createOpen}>

          <div>

            <DialogTitle>Create a Meeting</DialogTitle>

            <DialogContent>

              <TextField

                fullWidth

                label="Meeting ID"

                value={meetingId}

                onChange={(e) => setMeetingId(e.target.value)}

                variant="outlined"

                sx={{ mt: 2 }}

              />

              <TextField

                fullWidth

                label="Display Name"

                value={username}

                onChange={(e) => setUsername(e.target.value)}

                variant="outlined"

                sx={{ mt: 2 }}

              />

              {message && (

                <Typography color="error" sx={{ mt: 2 }}>

                  {message}

                </Typography>

              )}

            </DialogContent>

            <DialogActions>

              <Button onClick={() => setCreateOpen(false)} color="inherit">

                Cancel

              </Button>

              <Button onClick={() => handleCreate(true)} variant="contained" color="primary">

                Create

              </Button>

            </DialogActions>

          </div>

        </Fade>

      </Dialog>

      {/* Join Dialog */}

      <Dialog open={joinOpen} onClose={() => setJoinOpen(false)} maxWidth="sm" fullWidth>

        <Fade in={joinOpen}>

          <div>

            <DialogTitle>Join a Meeting</DialogTitle>

            <DialogContent>

              <TextField

                fullWidth

                label="Meeting ID"

                value={meetingId}

                onChange={(e) => setMeetingId(e.target.value)}

                variant="outlined"

                sx={{ mt: 2 }}

              />

              <TextField

                fullWidth

                label="Display Name"

                value={username}

                onChange={(e) => setUsername(e.target.value)}

                variant="outlined"

                sx={{ mt: 2 }}

              />

              {message && (

                <Typography color="error" sx={{ mt: 2 }}>

                  {message}

                </Typography>

              )}

            </DialogContent>

            <DialogActions>

              <Button onClick={() => setJoinOpen(false)} color="inherit">

                Cancel

              </Button>

              <Button onClick={() => handleJoin(false)} variant="contained" color="primary">

                Join

              </Button>

            </DialogActions>

          </div>

        </Fade>

      </Dialog>

    </>

  );

}

export default LandingPage;
