The "LIVE555 Media Server" is a complete RTSP server application. It can stream several kinds of media file (which must be stored in the current working directory - i.e., the directory from which you launch the application - or a subdirectory.):

    A MPEG Transport Stream file (with file name suffix ".ts")
    A Matroska or WebM file (with filename suffix ".mkv" or ".webm")
    An Ogg) file (with filename suffix ".ogg", "ogv", or ".opus")
    A MPEG-1 or 2 Program Stream file (with file name suffix ".mpg")
    A MPEG-4 Video Elementary Stream file (with file name suffix ".m4e")
    A H.264 Video Elementary Stream file (with file name suffix ".264")
    A H.265 Video Elementary Stream file (with file name suffix ".265")
    A VOB video+audio file (with file name suffix ".vob")
    A DV video file (with file name suffix ".dv")
    A MPEG-1 or 2 (including layer III - i.e., 'MP3') audio file (with file name suffix ".mp3")
    A WAV (PCM) audio file (with file name suffix ".wav")
    An AMR audio file (with file name suffix ".amr")
    An AC-3 audio file (with file name suffix ".ac3")
    An AAC (ADTS format) audio file (with file name suffix ".aac") 

These streams can be received/played by standards-compliant RTSP/RTP media clients, including:

    VLC media player
    QuickTime Player
    Amino set-top boxes (for playing MPEG Transport Streams only)
    The openRTSP command-line RTSP client (which receives/stores stream data, without playing it) 

Notes:

    The server can transmit multiple streams (from the same, or different files) concurrently
    By default, the server transmits its streams as RTP/UDP packets. If requested by the RTSP client, the server will stream its RTP (and RTCP) packets over TCP. (This can be useful for clients that are behind a firewall.)
    Some non-standard RTSP clients - such as Amino set-top boxes - request raw UDP streaming, rather than standard RTP streaming. Despite this, this server will accommodate such requests, and stream MPEG Transport Streams over raw-UDP, if requested. 