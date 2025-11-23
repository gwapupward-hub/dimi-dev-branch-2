import AccessControl "authorization/access-control";
import Principal "mo:base/Principal";
import OrderedMap "mo:base/OrderedMap";
import Debug "mo:base/Debug";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Text "mo:base/Text";
import Iter "mo:base/Iter";

actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();

  // Initialize auth (first caller becomes admin, others become users)
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    // Admin-only check happens inside
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public type AppRole = {
    #Producer;
    #Artist;
  };

  public type UserProfile = {
    name : Text;
    role : AppRole;
  };

  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
  var userProfiles = principalMap.empty<UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  let storage = Storage.new();
  include MixinStorage(storage);

  transient let textMap = OrderedMap.Make<Text>(Text.compare);

  public type Beat = {
    id : Text;
    title : Text;
    description : Text;
    producer : Principal;
    file : Storage.ExternalBlob;
    isShared : Bool;
  };

  public type Track = {
    id : Text;
    title : Text;
    artist : Principal;
    beatId : Text;
    file : Storage.ExternalBlob;
  };

  var beats = textMap.empty<Beat>();
  var tracks = textMap.empty<Track>();

  // Helper function to check if caller is a producer
  private func isProducer(caller : Principal) : Bool {
    switch (principalMap.get(userProfiles, caller)) {
      case (null) { false };
      case (?profile) {
        switch (profile.role) {
          case (#Producer) { true };
          case (#Artist) { false };
        };
      };
    };
  };

  // Helper function to check if caller is an artist
  private func isArtist(caller : Principal) : Bool {
    switch (principalMap.get(userProfiles, caller)) {
      case (null) { false };
      case (?profile) {
        switch (profile.role) {
          case (#Artist) { true };
          case (#Producer) { false };
        };
      };
    };
  };

  public shared ({ caller }) func uploadBeat(id : Text, title : Text, description : Text, file : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can upload beats");
    };

    if (not isProducer(caller)) {
      Debug.trap("Unauthorized: Only producers can upload beats");
    };

    let beat : Beat = {
      id;
      title;
      description;
      producer = caller;
      file;
      isShared = false;
    };

    beats := textMap.put(beats, id, beat);
  };

  public shared ({ caller }) func editBeat(id : Text, title : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can edit beats");
    };

    if (not isProducer(caller)) {
      Debug.trap("Unauthorized: Only producers can edit beats");
    };

    switch (textMap.get(beats, id)) {
      case (null) { Debug.trap("Beat not found") };
      case (?beat) {
        if (beat.producer != caller) {
          Debug.trap("Unauthorized: Only the producer can edit this beat");
        };

        let updatedBeat : Beat = {
          id = beat.id;
          title;
          description;
          producer = beat.producer;
          file = beat.file;
          isShared = beat.isShared;
        };

        beats := textMap.put(beats, id, updatedBeat);
      };
    };
  };

  public shared ({ caller }) func deleteBeat(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete beats");
    };

    if (not isProducer(caller)) {
      Debug.trap("Unauthorized: Only producers can delete beats");
    };

    switch (textMap.get(beats, id)) {
      case (null) { Debug.trap("Beat not found") };
      case (?beat) {
        if (beat.producer != caller) {
          Debug.trap("Unauthorized: Only the producer can delete this beat");
        };

        beats := textMap.delete(beats, id);
      };
    };
  };

  public shared ({ caller }) func shareBeat(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can share beats");
    };

    if (not isProducer(caller)) {
      Debug.trap("Unauthorized: Only producers can share beats");
    };

    switch (textMap.get(beats, id)) {
      case (null) { Debug.trap("Beat not found") };
      case (?beat) {
        if (beat.producer != caller) {
          Debug.trap("Unauthorized: Only the producer can share this beat");
        };

        let updatedBeat : Beat = {
          id = beat.id;
          title = beat.title;
          description = beat.description;
          producer = beat.producer;
          file = beat.file;
          isShared = true;
        };

        beats := textMap.put(beats, id, updatedBeat);
      };
    };
  };

  public shared ({ caller }) func unshareBeat(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can unshare beats");
    };

    if (not isProducer(caller)) {
      Debug.trap("Unauthorized: Only producers can unshare beats");
    };

    switch (textMap.get(beats, id)) {
      case (null) { Debug.trap("Beat not found") };
      case (?beat) {
        if (beat.producer != caller) {
          Debug.trap("Unauthorized: Only the producer can unshare this beat");
        };

        let updatedBeat : Beat = {
          id = beat.id;
          title = beat.title;
          description = beat.description;
          producer = beat.producer;
          file = beat.file;
          isShared = false;
        };

        beats := textMap.put(beats, id, updatedBeat);
      };
    };
  };

  public query func getSharedBeats() : async [Beat] {
    let sharedBeats = Iter.toArray(
      Iter.filter(
        textMap.vals(beats),
        func(beat : Beat) : Bool {
          beat.isShared;
        },
      )
    );
    sharedBeats;
  };

  public query ({ caller }) func getMyBeats() : async [Beat] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view their beats");
    };

    if (not isProducer(caller)) {
      Debug.trap("Unauthorized: Only producers can view their beats");
    };

    let myBeats = Iter.toArray(
      Iter.filter(
        textMap.vals(beats),
        func(beat : Beat) : Bool {
          beat.producer == caller;
        },
      )
    );
    myBeats;
  };

  public shared ({ caller }) func saveTrack(id : Text, title : Text, beatId : Text, file : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save tracks");
    };

    if (not isArtist(caller)) {
      Debug.trap("Unauthorized: Only artists can save tracks");
    };

    let track : Track = {
      id;
      title;
      artist = caller;
      beatId;
      file;
    };

    tracks := textMap.put(tracks, id, track);
  };

  public query ({ caller }) func getMyTracks() : async [Track] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view their tracks");
    };

    if (not isArtist(caller)) {
      Debug.trap("Unauthorized: Only artists can view their tracks");
    };

    let myTracks = Iter.toArray(
      Iter.filter(
        textMap.vals(tracks),
        func(track : Track) : Bool {
          track.artist == caller;
        },
      )
    );
    myTracks;
  };

  public shared ({ caller }) func deleteTrack(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete tracks");
    };

    if (not isArtist(caller)) {
      Debug.trap("Unauthorized: Only artists can delete tracks");
    };

    switch (textMap.get(tracks, id)) {
      case (null) { Debug.trap("Track not found") };
      case (?track) {
        if (track.artist != caller) {
          Debug.trap("Unauthorized: Only the artist can delete this track");
        };

        tracks := textMap.delete(tracks, id);
      };
    };
  };
};
