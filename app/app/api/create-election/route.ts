import { NextRequest, NextResponse } from "next/server";
import { Hex, createWalletClient, http } from "viem";
import { writeContract } from "viem/actions";
import { privateKeyToAccount } from "viem/accounts";
import {} from "viem";
import { addresses } from "@/contracts/addresses";
import { MACIAbi } from "@/contracts/abi/MACI";
import { PubKey } from "maci-domainobjs";

import { hardhat } from "viem/chains";

export async function POST(req: NextRequest) {
  try {
    const {} = await req.json();

    const ownerEvmPrivateKey = process.env.OWNER_EVM_PRIVATE_KEY as Hex;
    const ownerMaciPublicKey = process.env.OWNER_MACI_PUBLIC_KEY;

    const jsonRpcUrl = process.env.JSON_RPC_URL;

    if (!ownerEvmPrivateKey || !ownerMaciPublicKey || !jsonRpcUrl) {
      throw new Error("Required environment variables are not set");
    }

    const account = privateKeyToAccount(ownerEvmPrivateKey);

    const client = createWalletClient({
      transport: http(jsonRpcUrl),
      account,
    });

    const unserializedOwnerMaciPublicKey =
      PubKey.deserialize(ownerMaciPublicKey);

    const pollDuration = BigInt(0);
    const intStateTreeDepth = 1;
    const messageTreeSubDepth = 1;
    const messageTreeDepth = 2;
    const voteOptionTreeDepth = 2;

    const txResponse = await writeContract(client, {
      address: addresses.MACI,
      abi: MACIAbi,
      functionName: "deployPoll",
      args: [
        pollDuration,
        {
          intStateTreeDepth,
          messageTreeSubDepth,
          messageTreeDepth,
          voteOptionTreeDepth,
        },
        unserializedOwnerMaciPublicKey.asContractParam() as {
          x: bigint;
          y: bigint;
        },
        addresses.Verifier,
        addresses.VkRegistry,
        1, // EMode.NON_QV
      ],
      account,
      chain: hardhat,
    });

    console.log("txResponse", txResponse);

    return NextResponse.json({ message: "Data processed successfully" });
  } catch (error) {
    console.log("error", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
