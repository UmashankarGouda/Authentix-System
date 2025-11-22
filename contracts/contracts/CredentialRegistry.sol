// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CredentialRegistry {
    struct Credential {
        uint256 id;
        address issuer;
        bytes32 fileHash;
        bytes32 jsonHash;
        string cid;
        uint256 timestamp;
        bool exists;
    }

    mapping(bytes32 => Credential) private credentialsByFileHash;
    mapping(bytes32 => Credential) private credentialsByJsonHash;
    uint256 private credentialCounter;

    event CredentialIssued(
        uint256 indexed credId,
        address indexed issuer,
        bytes32 fileHash,
        bytes32 jsonHash,
        string cid
    );

    function issueCredential(
        bytes32 fileHash,
        bytes32 jsonHash,
        string memory cid
    ) external returns (uint256) {
        require(!credentialsByFileHash[fileHash].exists, "Credential already exists");
        
        credentialCounter++;
        uint256 newCredId = credentialCounter;

        Credential memory newCred = Credential({
            id: newCredId,
            issuer: msg.sender,
            fileHash: fileHash,
            jsonHash: jsonHash,
            cid: cid,
            timestamp: block.timestamp,
            exists: true
        });

        credentialsByFileHash[fileHash] = newCred;
        credentialsByJsonHash[jsonHash] = newCred;

        emit CredentialIssued(newCredId, msg.sender, fileHash, jsonHash, cid);

        return newCredId;
    }

    function getCredentialByFileHash(bytes32 fileHash)
        external
        view
        returns (
            uint256,
            address,
            bytes32,
            bytes32,
            string memory,
            uint256
        )
    {
        Credential memory cred = credentialsByFileHash[fileHash];
        require(cred.exists, "Credential not found");
        return (cred.id, cred.issuer, cred.fileHash, cred.jsonHash, cred.cid, cred.timestamp);
    }

    function getCredentialByJsonHash(bytes32 jsonHash)
        external
        view
        returns (
            uint256,
            address,
            bytes32,
            bytes32,
            string memory,
            uint256
        )
    {
        Credential memory cred = credentialsByJsonHash[jsonHash];
        require(cred.exists, "Credential not found");
        return (cred.id, cred.issuer, cred.fileHash, cred.jsonHash, cred.cid, cred.timestamp);
    }
}
