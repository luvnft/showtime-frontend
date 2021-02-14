import { useState, useEffect, useContext, useRef } from "react";
import Head from "next/head";
import _ from "lodash";
//import Link from "next/link";
import mixpanel from "mixpanel-browser";
import Layout from "../../components/layout";
import TokenGridV4 from "../../components/TokenGridV4";
import backend from "../../lib/backend";
import AppContext from "../../context/app-context";
import ShareButton from "../../components/ShareButton";
import FollowGrid from "../../components/FollowGrid";
import { useRouter } from "next/router";
import ModalEditName from "../../components/ModalEditName";
import ModalEditPhoto from "../../components/ModalEditPhoto";

export async function getServerSideProps(context) {
  const { slug } = context.query;

  // Get profile metadata
  const response_profile = await backend.get(`/v2/profile/${slug}?limit=200`);
  const data_profile = response_profile.data.data;

  const name = data_profile.profile.name;
  const img_url = data_profile.profile.img_url;
  const wallet_addresses = data_profile.profile.wallet_addresses;
  const created_items = data_profile.created;
  const owned_items = data_profile.owned;
  const liked_items = data_profile.liked;
  const followers_list = data_profile.followers;
  const following_list = data_profile.following;

  // Get followers
  //const response_followers = await backend.get(`/v1/followers?address=${slug}`);
  //const followers_list = response_followers.data.data;

  // Get following
  //const response_following = await backend.get(`/v1/myfollows?address=${slug}`);
  //const following_list = response_following.data.data;

  return {
    props: {
      name,
      img_url,
      wallet_addresses,
      created_items,
      owned_items,
      liked_items,
      slug,
      followers_list,
      following_list,
    }, // will be passed to the page component as props
  };
}

const Profile = ({
  name,
  img_url,
  wallet_addresses,
  created_items,
  owned_items,
  liked_items,
  slug,
  followers_list,
  following_list,
}) => {
  const router = useRouter();
  const context = useContext(AppContext);

  const web3Modal = context?.web3Modal;

  const logoutOfWeb3Modal = function () {
    if (web3Modal) web3Modal.clearCachedProvider();
  };

  const [isMyProfile, setIsMyProfile] = useState();
  const [isFollowed, setIsFollowed] = useState(false);

  useEffect(() => {
    const checkIfFollowed = async () => {
      var it_is_followed = false;
      await _.forEach(context.myFollows, (follow) => {
        if (wallet_addresses.includes(follow.wallet_address)) {
          it_is_followed = true;
        }
      });
      setIsFollowed(it_is_followed);
    };

    checkIfFollowed();
  }, [context.myFollows, wallet_addresses]);

  const [likedItems, setLikedItems] = useState([]);
  //const [likedRefreshed, setLikedRefreshed] = useState(false);

  useEffect(() => {
    setLikedItems(
      liked_items.filter(
        (item) => item.token_hidden !== 1 && item.token_img_url
      )
    );
    //setLikedRefreshed(false);
  }, [liked_items]);

  const [createdItems, setCreatedItems] = useState([]);
  //const [createdRefreshed, setCreatedRefreshed] = useState(false);

  useEffect(() => {
    setCreatedItems(
      created_items.filter(
        (item) => item.token_hidden !== 1 && item.token_img_url
      )
    );
    //setCreatedRefreshed(false);
  }, [created_items]);

  const [ownedItems, setOwnedItems] = useState([]);
  //const [ownedRefreshed, setOwnedRefreshed] = useState(false);

  useEffect(() => {
    setOwnedItems(
      owned_items.filter(
        (item) => item.token_hidden !== 1 && item.token_img_url
      )
    );
    //setOwnedRefreshed(false);
  }, [owned_items]);

  const [followers, setFollowers] = useState([]);
  useEffect(() => {
    setFollowers(followers_list);
  }, [followers_list]);

  const [following, setFollowing] = useState([]);
  useEffect(() => {
    setFollowing(following_list);
  }, [following_list]);

  useEffect(() => {
    // Wait for identity to resolve before recording the view
    if (typeof context.user !== "undefined") {
      if (context.user) {
        // Logged in?
        if (slug === context.user.publicAddress) {
          setIsMyProfile(true);
          mixpanel.track("Self profile view", { slug: slug });
        } else {
          setIsMyProfile(false);
          mixpanel.track("Profile view", { slug: slug });
        }
      } else {
        // Logged out
        setIsMyProfile(false);
        mixpanel.track("Profile view", { slug: slug });
      }
    }
  }, [owned_items, typeof context.user]);

  const logout = async () => {
    const authRequest = await fetch("/api/logout", {
      method: "POST",
    });

    if (authRequest.ok) {
      // We successfully logged in, our API
      // set authorization cookies and now we
      // can redirect to the dashboard!
      //router.push("/");
      logoutOfWeb3Modal();
      context.setUser(null);
      context.setMyLikes([]);
      context.setMyFollows([]);
      //router.push("/");
      //window.location.href = "/";
      mixpanel.track("Logout");
      setIsMyProfile(false);
    } else {
      /* handle errors */
    }
  };

  const [columns, setColumns] = useState(2);

  useEffect(() => {
    if (context.windowSize && context.windowSize.width < 820) {
      setColumns(1);
    } else if (context.windowSize && context.windowSize.width < 1200) {
      setColumns(2);
    } else if (context.windowSize && context.windowSize.width < 1600) {
      setColumns(3);
    } else {
      setColumns(4);
    }
  }, [context.windowSize]);

  const handleLoggedOutFollow = () => {
    mixpanel.track("Follow but logged out");
    router.push("/login");
  };

  const handleFollow = async () => {
    setIsFollowed(true);
    // Change myFollows via setMyFollows
    context.setMyFollows([
      {
        profile_id: null,
        wallet_address: wallet_addresses[0],
        name: name,
        img_url: img_url
          ? img_url
          : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png",
        timestamp: null,
      },
      ...context.myFollows,
    ]);

    setFollowers([
      {
        profile_id: null,
        wallet_address: context.user.publicAddress,
        name: context.myProfile.name,
        img_url: context.myProfile.img_url
          ? context.myProfile.img_url
          : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png",
        timestamp: null,
      },
      ...followers,
    ]);

    // Post changes to the API
    await fetch(`/api/follow/${slug}`, {
      method: "post",
    });

    mixpanel.track("Followed profile");
  };

  const handleUnfollow = async () => {
    setIsFollowed(false);
    // Change myLikes via setMyLikes
    context.setMyFollows(
      context.myFollows.filter(
        (item) => !wallet_addresses.includes(item.wallet_address)
      )
    );

    setFollowers(
      followers.filter(
        (follower) =>
          !context.myProfile.wallet_addresses.includes(follower.wallet_address)
      )
    );

    // Post changes to the API
    await fetch(`/api/unfollow/${slug}`, {
      method: "post",
    });

    mixpanel.track("Unfollowed profile");
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [pictureModalOpen, setPictureModalOpen] = useState(false);

  const [selectedGrid, setSelectedGrid] = useState("created");

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  useEffect(() => {
    if (createdItems.length > 0 && createdItems.length > ownedItems.length) {
      setSelectedGrid("created");
    } else if (ownedItems.length > 0) {
      setSelectedGrid("owned");
    } else {
      setSelectedGrid("liked");
    }
    setShowFollowers(false);
    setShowFollowing(false);
  }, [wallet_addresses, createdItems.length, ownedItems.length]);

  return (
    <Layout>
      <Head>
        <title>
          Profile |{" "}
          {isMyProfile
            ? context.myProfile
              ? context.myProfile.name
                ? context.myProfile.name
                : "Unnamed"
              : name
              ? name
              : "Unnamed"
            : name
            ? name
            : "Unnamed"}
        </title>

        <meta
          name="description"
          content="Explore digital art I've created, owned, and liked"
        />
        <meta property="og:type" content="website" />
        <meta
          name="og:description"
          content="Explore digital art I've created, owned, and liked"
        />
        <meta
          property="og:image"
          content={
            img_url
              ? img_url
              : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png"
          }
        />
        <meta name="og:title" content={name ? name : wallet_addresses[0]} />

        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content={name ? name : wallet_addresses[0]}
        />
        <meta
          name="twitter:description"
          content="Explore digital art I've created, owned, and liked"
        />
        <meta
          name="twitter:image"
          content={
            img_url
              ? img_url
              : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png"
          }
        />
      </Head>

      {typeof document !== "undefined" ? (
        <>
          <ModalEditName
            isOpen={editModalOpen}
            setEditModalOpen={setEditModalOpen}
          />
          <ModalEditPhoto
            isOpen={pictureModalOpen}
            setEditModalOpen={setPictureModalOpen}
          />
        </>
      ) : null}

      <div className="px-4 md:px-16 flex flex-col md:flex-row items-center pb-12 pt-12">
        <div className="flex-shrink">
          <img
            alt="artist"
            className="rounded-full object-cover object-center w-24 h-24 lg:w-24 lg:h-24 mx-auto mb-1 md:mb-0 md:mr-4"
            src={
              isMyProfile
                ? context.myProfile
                  ? context.myProfile.img_url
                    ? context.myProfile.img_url
                    : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png"
                  : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png"
                : img_url
                ? img_url
                : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png"
            }
          />
        </div>
        <div className="flex-grow flex flex-row items-center">
          <div className="flex flex-col">
            <div className="flex flex-row items-center">
              <div
                className="text-3xl md:text-5xl showtime-title ml-4 md:ml-0 mt-2 md:mt-0"
                style={{ fontWeight: 600 }}
              >
                {isMyProfile
                  ? context.myProfile
                    ? context.myProfile.name
                      ? context.myProfile.name
                      : "Unnamed"
                    : name
                    ? name
                    : "Unnamed"
                  : name
                  ? name
                  : "Unnamed"}
              </div>
              {isMyProfile ? null : columns > 2 ? (
                <div className="tooltip ml-4">
                  <button
                    className={
                      isFollowed
                        ? "showtime-green-button text-sm px-3 py-1  items-center"
                        : "showtime-like-button-white-green-hover text-sm px-3 py-1  items-center"
                    }
                    onClick={() =>
                      context.user
                        ? isFollowed
                          ? handleUnfollow()
                          : handleFollow()
                        : handleLoggedOutFollow()
                    }
                  >
                    {isFollowed ? "Following" : "Follow"}
                  </button>
                  {context.user ? null : (
                    <span
                      style={{ fontSize: 12, opacity: 0.9, width: 110 }}
                      className="tooltip-text bg-black p-3 -mt-7 -ml-24 rounded text-white"
                    >
                      Log in to follow
                    </span>
                  )}
                </div>
              ) : null}
              <div>
                <ShareButton
                  url={
                    typeof window !== "undefined" ? window.location.href : null
                  }
                  type={"profile"}
                />
              </div>
            </div>
            <div
              style={{
                fontWeight: 400,
                fontSize: 12,
                marginTop: 8,
                color: "#999",
              }}
            >
              {columns > 2 ? (
                wallet_addresses[0]
              ) : isMyProfile ? (
                <div className="text-center md:text-left">
                  <a
                    href="#"
                    onClick={() => {
                      setPictureModalOpen(true);
                      mixpanel.track("Open edit photo");
                    }}
                    className="showtime-logout-link"
                    style={{ whiteSpace: "nowrap", fontWeight: 400 }}
                  >
                    {context.myProfile &&
                    context.myProfile.img_url &&
                    !context.myProfile.img_url.includes("opensea-profile")
                      ? "Edit photo"
                      : "Add photo"}
                  </a>
                  {" \u00A0\u00A0\u00A0 "}
                  <a
                    href="#"
                    onClick={() => {
                      setEditModalOpen(true);
                      mixpanel.track("Open edit name");
                    }}
                    className="showtime-logout-link"
                    style={{ whiteSpace: "nowrap", fontWeight: 400 }}
                  >
                    {context.myProfile && context.myProfile.name
                      ? "Edit name"
                      : "Add name"}
                  </a>
                  {" \u00A0\u00A0\u00A0 "}
                  <a
                    href="#"
                    onClick={() => {
                      logout();
                    }}
                    className="showtime-logout-link "
                    style={{ whiteSpace: "nowrap", fontWeight: 400 }}
                  >
                    Log out
                  </a>
                </div>
              ) : (
                <div className="tooltip text-center md:text-left">
                  <button
                    className={
                      isFollowed
                        ? "showtime-green-button text-sm px-3 py-1  items-center"
                        : "showtime-like-button-white-green-hover text-sm px-3 py-1  items-center"
                    }
                    onClick={() =>
                      context.user
                        ? isFollowed
                          ? handleUnfollow()
                          : handleFollow()
                        : handleLoggedOutFollow()
                    }
                  >
                    {isFollowed ? "Following" : "Follow"}
                  </button>
                  {context.user ? null : (
                    <span
                      style={{ fontSize: 12, opacity: 0.9, width: 110 }}
                      className="tooltip-text bg-black p-3 -mt-7 -ml-24 rounded text-white"
                    >
                      Log in to follow
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="place-self-start text-sm">
          {columns > 2 ? (
            isMyProfile ? (
              <>
                <a
                  href="#"
                  onClick={() => {
                    setPictureModalOpen(true);
                    mixpanel.track("Open edit photo");
                  }}
                  className="showtime-logout-link"
                  style={{ whiteSpace: "nowrap", fontWeight: 400 }}
                >
                  {context.myProfile &&
                  context.myProfile.img_url &&
                  !context.myProfile.img_url.includes("opensea-profile")
                    ? "Edit photo"
                    : "Add photo"}
                </a>
                {" \u00A0\u00A0\u00A0 "}
                <a
                  href="#"
                  onClick={() => {
                    setEditModalOpen(true);
                    mixpanel.track("Open edit name");
                  }}
                  className="showtime-logout-link"
                  style={{ whiteSpace: "nowrap", fontWeight: 400 }}
                >
                  {context.myProfile && context.myProfile.name
                    ? "Edit name"
                    : "Add name"}
                </a>
                {" \u00A0\u00A0\u00A0 "}
                <a
                  href="#"
                  onClick={() => {
                    logout();
                  }}
                  className="showtime-logout-link float-right"
                  style={{ whiteSpace: "nowrap", fontWeight: 400 }}
                >
                  Log out
                </a>
              </>
            ) : (
              "\u00A0"
            )
          ) : null}
        </div>
      </div>
      <div
        className="bg-white px-4 md:px-16 py-6 text-sm"
        style={{
          boxShadow: "0px 4px 10px 6px rgba(34, 48, 67, 2%)",
          fontWeight: 400,
        }}
      >
        <div className="mb-4">
          {followers && followers.length > 0 ? (
            <>
              <div className="">
                {followers.length > 1
                  ? `${followers.length} followers`
                  : "1 follower"}

                <span
                  onClick={() => {
                    setShowFollowers(!showFollowers);
                  }}
                  className="text-xs ml-3 view-hide-toggle"
                >
                  {showFollowers ? "Hide" : "View"}
                </span>
              </div>

              {showFollowers ? (
                <div className="mt-2">
                  <FollowGrid people={followers} />
                </div>
              ) : (
                <div className=""></div>
              )}
            </>
          ) : (
            <div className="">No followers yet</div>
          )}
        </div>

        <div>
          {following && following.length > 0 ? (
            <>
              <div className="">
                {following.length > 1
                  ? `${following.length} following`
                  : "1 following"}

                <span
                  onClick={() => {
                    setShowFollowing(!showFollowing);
                  }}
                  className="text-xs ml-3 view-hide-toggle"
                >
                  {showFollowing ? "Hide" : "View"}
                </span>
              </div>

              {showFollowing ? (
                <div className="mt-2">
                  <FollowGrid people={following} />
                </div>
              ) : (
                <div className=""></div>
              )}
            </>
          ) : (
            <div>Not following anyone yet</div>
          )}
        </div>
      </div>

      {createdItems.length > 0 ||
      ownedItems.length > 0 ||
      likedItems.length > 0 ? (
        <div className="mx-auto text-center mb-6 mt-8 text-xs sm:text-sm">
          {context.windowSize ? (
            context.windowSize.width < 375 ? (
              <>
                <br />
                <br />
              </>
            ) : null
          ) : null}
          <button
            className={
              selectedGrid === "created"
                ? "showtime-like-button-pink px-4 py-1"
                : "showtime-like-button-white px-4 py-1"
            }
            style={{
              borderBottomRightRadius: 0,
              borderTopRightRadius: 0,
              borderRightWidth: 1,
            }}
            onClick={() => {
              setSelectedGrid("created");
            }}
          >
            {createdItems.length < 200 ? createdItems.length : "200+"} Created
          </button>
          <button
            className={
              selectedGrid === "owned"
                ? "showtime-like-button-pink px-4 py-1"
                : "showtime-like-button-white px-4 py-1"
            }
            style={{ borderRadius: 0, borderLeftWidth: 1, borderRightWidth: 1 }}
            onClick={() => {
              setSelectedGrid("owned");
            }}
          >
            {ownedItems.length < 200 ? ownedItems.length : "200+"} Owned
          </button>
          <button
            className={
              selectedGrid === "liked"
                ? "showtime-like-button-pink px-4 py-1"
                : "showtime-like-button-white px-4 py-1"
            }
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderLeftWidth: 1,
            }}
            onClick={() => {
              setSelectedGrid("liked");
            }}
          >
            {likedItems.length < 200 ? likedItems.length : "200+"} Liked
          </button>
        </div>
      ) : null}

      <TokenGridV4
        items={
          selectedGrid === "created"
            ? createdItems
            : selectedGrid === "owned"
            ? ownedItems
            : selectedGrid === "liked"
            ? likedItems
            : null
        }
      />
    </Layout>
  );
};

export default Profile;
