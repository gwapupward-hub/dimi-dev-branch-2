import Blob "mo:base/Blob";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Storage "./Storage";

module {
  public type MixinId = Text;

  public type MixinData = {
    id: MixinId;
    owner: Principal;
    blobData: Storage.BlobData;
    createdAt: Int;
  };

  public class MixinStorage() {
    let mixins = HashMap.HashMap<MixinId, MixinData>(0, Text.equal, Text.hash);
    let storage = Storage.Storage();

    public func storeMixin(id: MixinId, owner: Principal, data: Blob, contentType: Text, createdAt: Int) : MixinData {
      let blobData = storage.storeBlob(data, contentType);
      let mixinData: MixinData = {
        id = id;
        owner = owner;
        blobData = blobData;
        createdAt = createdAt;
      };
      mixins.put(id, mixinData);
      mixinData
    };

    public func getMixin(id: MixinId) : ?MixinData {
      mixins.get(id)
    };

    public func retrieveMixinBlob(id: MixinId) : ?Blob {
      switch (mixins.get(id)) {
        case (?mixinData) {
          ?storage.retrieveBlob(mixinData.blobData)
        };
        case null { null };
      }
    };

    public func deleteMixin(id: MixinId) : Bool {
      switch (mixins.remove(id)) {
        case (?_) { true };
        case null { false };
      }
    };

    public func listMixinsByOwner(owner: Principal) : [MixinData] {
      let buffer = Buffer.Buffer<MixinData>(0);
      for ((id, mixinData) in mixins.entries()) {
        if (Principal.equal(mixinData.owner, owner)) {
          buffer.add(mixinData);
        };
      };
      Buffer.toArray(buffer)
    };
  };

  // Need to import Buffer
  module Buffer {
    public class Buffer<T>(initCapacity : Nat) {
      var items : [var ?T] = Array.init<?T>(initCapacity, null);
      var count = 0;

      public func add(item : T) {
        if (count >= items.size()) {
          let newSize = if (items.size() == 0) { 1 } else { items.size() * 2 };
          let newItems = Array.init<?T>(newSize, null);
          var i = 0;
          while (i < count) {
            newItems[i] := items[i];
            i += 1;
          };
          items := newItems;
        };
        items[count] := ?item;
        count += 1;
      };

      public func toArray() : [T] {
        Array.tabulate<T>(count, func(i) {
          switch (items[i]) {
            case (?item) { item };
            case null { Debug.trap("Unexpected null") };
          }
        })
      };
    };
  };
}
