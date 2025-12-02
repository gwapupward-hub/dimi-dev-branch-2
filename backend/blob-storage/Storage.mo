import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Buffer "mo:base/Buffer";

module {
  public type ExternalBlob = {
    data: Blob;
    contentType: Text;
  };

  public type Chunk = {
    data: Blob;
    index: Nat;
  };

  public type BlobData = {
    chunks: [Chunk];
    totalSize: Nat;
    contentType: Text;
  };

  public class Storage() {
    // Store blobs in chunks to handle large files
    public func storeBlob(data: Blob, contentType: Text) : BlobData {
      let chunkSize = 1_000_000; // 1MB chunks
      let bytes = Blob.toArray(data);
      let totalSize = bytes.size();
      let numChunks = (totalSize + chunkSize - 1) / chunkSize;

      let chunks = Buffer.Buffer<Chunk>(numChunks);

      var i = 0;
      while (i < numChunks) {
        let start = i * chunkSize;
        let end = Nat.min(start + chunkSize, totalSize);
        let chunkData = Array.tabulate<Nat8>(end - start, func(j) {
          bytes[start + j]
        });

        chunks.add({
          data = Blob.fromArray(chunkData);
          index = i;
        });
        i += 1;
      };

      {
        chunks = Buffer.toArray(chunks);
        totalSize = totalSize;
        contentType = contentType;
      }
    };

    public func retrieveBlob(blobData: BlobData) : Blob {
      let buffer = Buffer.Buffer<Nat8>(blobData.totalSize);

      for (chunk in blobData.chunks.vals()) {
        let bytes = Blob.toArray(chunk.data);
        for (byte in bytes.vals()) {
          buffer.add(byte);
        };
      };

      Blob.fromArray(Buffer.toArray(buffer))
    };

    public func getBlobSize(blobData: BlobData) : Nat {
      blobData.totalSize
    };

    public func getContentType(blobData: BlobData) : Text {
      blobData.contentType
    };
  };
}
