/**
 * Home page that shows all of a user's submissions.
 * @author Austen Money
 * @author Avery Hanna
 * @author So Hyun Kim
 */

// Import React
import React, { useEffect, useReducer, useState } from "react";
import { TailSpin } from "react-loader-spinner";

// Import Next
import Link from "next/link";

// Import clerk
import { UserButton, useUser } from "@clerk/nextjs";

// Import components
import SubmissionForm from '../SubmissionForm';
import UserEditableSubmission from './UserEditableSubmission';
import SubmissionThumbnail from './SubmissionThumbnail';

// Import types
import Submission from "@/types/Submission";
import Statuses from "@/types/Statuses";

/*------------------------------------------------------------------------*/
/* ------------------------------ Types --------------------------------- */
/*------------------------------------------------------------------------*/

enum FilterType {
    // No filtering of submissions
    None = "None",
    // Filter to just approved submissions
    Approved = "Approved",
    // Filter to just current submissions
    Current = "Current"
}

/*------------------------------------------------------------------------*/
/* -------------------------------- State ------------------------------- */
/*------------------------------------------------------------------------*/

/* -------- State Definition -------- */

type State = {
    // How the submissions should be filtered
    filter: FilterType;
    // Current issue
    currentIssue: string;
    // All user submissions
    allSubmissions: Submission[];
    // Submission to show in the edit modal
    editModalSubmission?: Submission;
    // Whether to show loading spinner
    isLoading: boolean;
    // Either display as homepage or submission form 
    view: "Homepage" | "Submission";
};

/* ------------- Actions ------------ */

// Types of actions
enum ActionType {
    ChangeFilter = "ChangeFilter",
    setCurrentIssue = "setCurrentIssue",
    UpdateAllSubmissions = "UpdateAllSubmissions",
    ChangeEditModal = "ChangeEditModal",
    ToggleLoadingOn = "ToggleLoadingOn",
    ToggleLoadingOff = "ToggleLoadingOff",
    SwitchView = 'SwitchView'
}

// Action definitions
type Action =
    | {
          // Action type
          type: ActionType.ChangeFilter;
          // Filter to change to
          newFilter: FilterType;
      }
    | {
          // Action type
          type: ActionType.setCurrentIssue;
          // Issue
          currentIssue: string;
      }
    | {
          // Action type
          type: ActionType.UpdateAllSubmissions;
          // Submissions to update to
          newSubmissions: Submission[];
      }
    | {
            // Action type
            type: ActionType.ChangeEditModal;
            // Submission to show in modal
            submission: Submission | undefined;
      }
    | {
          // Action type
          type: ActionType.ToggleLoadingOn;
      }
    | {
          // Action type
          type: ActionType.ToggleLoadingOff;
      }
    | {
          // Action type
          type: ActionType.SwitchView; 
          // New view to change to 
          newView: "Homepage" | "Submission"; //payload
    };

/**
 * Reducer that executes actions
 * @author Austen Money
 * @param state current state
 * @param action action to execute
 * @returns updated state
 */
const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case ActionType.ChangeFilter: {
            return {
                ...state,
                filter: action.newFilter,
            };
        }
        case ActionType.setCurrentIssue: {
            return {
                ...state,
                currentIssue: action.currentIssue,
            };
        }
        case ActionType.UpdateAllSubmissions: {
            return {
                ...state,
                allSubmissions: action.newSubmissions
            };
        }
        case ActionType.ChangeEditModal: {
            return {
                ...state,
                editModalSubmission: action.submission,
            };
        }
        case ActionType.ToggleLoadingOn: {
            return {
                ...state,
                isLoading: true
            };
        }
        case ActionType.ToggleLoadingOff: {
            return {
                ...state,
                isLoading: false
            };
        }
        case ActionType.SwitchView: {
            return {
                ...state,
                view: action.newView,
            };
        }
        default: {
            return state;
        }
    }
};

/*------------------------------------------------------------------------*/
/* ------------------------------ Component ----------------------------- */
/*------------------------------------------------------------------------*/

export default function HomePage() {
    /*------------------------------------------------------------------------*/
    /* -------------------------------- Setup ------------------------------- */
    /*------------------------------------------------------------------------*/

    /* -------------- State ------------- */

    // Initial state
    const initialState: State = {
        filter: FilterType.None,
        currentIssue: "",
        allSubmissions: [],
        editModalSubmission: undefined,
        isLoading: false,
        view: "Homepage"
    };

    // Initialize state
    const [state, dispatch] = useReducer(reducer, initialState);

    // Destructure common state
    const {
        filter,
        currentIssue,
        allSubmissions,
        editModalSubmission,
        isLoading,
        view,
    } = state;

    const { user } = useUser();

    const [issues, setIssues] = useState<string[]>([]);

    /*------------------------------------------------------------------------*/
    /* ------------------------- Component Functions ------------------------ */
    /*------------------------------------------------------------------------*/

    /**
     * Filters given Submission array to just the given type.
     * @author Austen Money
     * @param submissions submissions to filter
     * @param filter how to filter the submissions
     * @returns filtered submissions
     */
    const filteredSubmissions = ((): Submission[] => {
        switch (filter) {
            case FilterType.Approved: {
                return allSubmissions.filter(submission => {
                    return submission.status === Statuses.Approved;
                });
            }
            case FilterType.Current: {
                return allSubmissions.filter(submission => {
                    return submission.issue === currentIssue;
                });
            }
            case FilterType.None: {
                return allSubmissions;
            }
            default: {
                return allSubmissions;
            }
        }
    })();

    /**
     * Fetches the issue themes from the database and sets the issues state
     * @author Austen Money
     * @author Walid Nejmi
     * @param event the event that has been changed
     */
    const fetchIssueThemes = async () => {
        try {
            const issues = await fetch("../api/issues/get", { method: "GET" })
            .then(response => response.json())
            .then(res => res.data.map((issue: any) => [issue.status, issue.title]));

            const issueTitles = issues.forEach((issue: [string, string]) => issues[1]);
            const fetchedIssue = issues.filter((issue: [string, string]) => issue[0] === "Current")

            setIssues(issueTitles);
            if (fetchedIssue) {
                dispatch({
                    type: ActionType.setCurrentIssue,
                    currentIssue: fetchedIssue[0][1],
                });
            }
        } catch (error) {
            console.error("Error fetching issue themes: ", error);
            return [];
        }
    };

    /**
     * Getting submission for user getting onto the webpage
     * @author So Hyun Kim, Avery Hanna
     * @returns submissions of all users
     */
    const getSubmissions = async () => {
        // Show loading spinner
        dispatch({
            type: ActionType.ToggleLoadingOn
        });

        if (!user) {
            return;
        }
        try {
            // get submissions from database
            const authorId = user?.id;
            const url = `/api/submissions/get-by-user?id=${authorId}`;

            await fetch(url, {
                method: "GET"
            })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        dispatch({
                            type: ActionType.UpdateAllSubmissions,
                            newSubmissions: res.data
                                .reverse()
                                .map((data: any) => data.submission)
                        });
                    } else {
                        console.error("Failed to connect to database");
                    }
                })
                .then(() => {
                    // Hide loading spinner
                    dispatch({
                        type: ActionType.ToggleLoadingOff
                    });
                });
        } catch (error) {
            console.error(error);
        }
    };

    const finishSubmit = async (body: FormData, submission: Submission) => {
        // Switch view back to homepage
        dispatch({
            type: ActionType.SwitchView,
            newView: "Homepage"
        });
        dispatch({
            type: ActionType.ToggleLoadingOn
        })

        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/update`, {
            method: "POST",
            body,
        })
        .then(async () => {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`)
            .then(res => res.json())
            .then(res => res.body)
            .then(responses => {
                // Update main submission with drive info
                if (responses[0]) {
                    submission.mainSubmission.contentDriveUrl = `https://drive.google.com/file/d/${responses[0].id}`;
                    submission.mainSubmission.imageUrl = responses[0].imageUrl;
                }
                // Update additional references with drive info
                if (submission.additionalReferences && responses.length > 1) {
                    for (let i = 1; i < responses.length; i++) {
                        submission.additionalReferences[i - 1].contentDriveUrl = `https://drive.google.com/file/d/${responses[i].id}`;
                        submission.additionalReferences[i - 1].imageUrl = responses[i].imageUrl;
                    }
                }
            })
        })
        .then(async () => {
            try {
                // add submission to database
                await fetch("../api/submissions/add", {
                    method: "POST",
                    body: JSON.stringify({
                        submission: submission,
                    })
                });
            } catch (error) {
                console.error(error);
            }
        })
        .catch(err => console.error(err));

        // Update submissions
        await getSubmissions();

        // Hide loading spinner
        dispatch({
            type: ActionType.ToggleLoadingOff
        });
    }
    /*------------------------------------------------------------------------*/
    /* ------------------------- Lifecycle Functions ------------------------ */
    /*------------------------------------------------------------------------*/

    /**
     * Get submissions and issues when user is loaded or updated
     * @author Avery Hanna, So Hyun Kim
     */
    useEffect(() => {
        (async () => {
            // TODO: fix this hacky way of getting submissions
            await getSubmissions();
            await fetchIssueThemes();
        })();
    }, [user]);

    /**
     * Filter submissions by current filter whenever all submissions are updated
     * @author Austen Money
     */
    useEffect(() => {
        (() => {
            dispatch({
                type: ActionType.ChangeFilter,
                newFilter: filter
            });
        })();
    }, [filter]);

    if (!user) {
        return null;
    }

    /*------------------------------------------------------------------------*/
    /* ------------------------------- Render ------------------------------- */
    /*------------------------------------------------------------------------*/

    /*----------------------------------------*/
    /* --------------- Main UI -------------- */
    /*----------------------------------------*/
    if (view === "Submission") {
            return (
                <SubmissionForm
                    finishSubmit={finishSubmit}
                    goBack={() => {dispatch({type: ActionType.SwitchView, newView: "Homepage"})}}
                />
            );
    } else {
    return (
        <div className="min-h-screen w-full flex flex-col gradient-background">
            {
                editModalSubmission && <div className="h-full w-full fixed bg-black bg-opacity-50 z-40"/>
            }
            <div className="HomePage-top-bar border-b border-primary-blue">
                <div className="m-6 mx-5 flex flex-row justify-between">
                    <div className="flex text-2xl lg:text-3xl xl:text-4xl font-bold text-primary-blue">
                        My Work
                    </div>
                    <li className="flex items-center space-x-4 font-semibold">
                        <button className="HomePage-submit-button lg:text-lg xl:text-xl shadow-md"
                                onClick={() => {
                                    dispatch({
                                        type: ActionType.SwitchView,
                                        newView: "Submission"
                                    });
                                }}>
                            Submit Work
                        </button>
                        <div className="ml-4">
                            <UserButton afterSignOutUrl="/" />
                        </div>
                    </li>
                </div>
                <div className="flex items-end"> {/* ${isOpen ? "is-open" : ""} flex-row justify-around justify-items-stretch top-16 left-20 */}
                    <li className="flex m-5 space-x-8"> {/*pt-4 pl-16 space-x-20*/}
                        <button
                            onClick={() => {
                                dispatch({
                                    type: ActionType.ChangeFilter,
                                    newFilter: FilterType.Current
                                });
                            }}
                            className={
                                `text-primary-blue ${filter === FilterType.Current ? "font-bold " : ""} text-base lg:text-lg xl:text-xl`
                            }
                        >
                            Current Submissions
                        </button>
                        <button
                            onClick={() => {
                                dispatch({
                                    type: ActionType.ChangeFilter,
                                    newFilter: FilterType.None
                                });
                            }}
                            className={
                                `text-primary-blue ${filter === FilterType.None ? "font-bold " : ""} text-base lg:text-lg xl:text-xl`
                            }
                        >
                            All Submissions
                        </button>
                        <button
                            onClick={() => {
                                dispatch({
                                    type: ActionType.ChangeFilter,
                                    newFilter: FilterType.Approved
                                });
                            }}
                            className={
                                `text-primary-blue ${filter === FilterType.Approved ? "font-bold " : ""} text-base lg:text-lg xl:text-xl`
                            }
                        >
                            Approved Works
                        </button>
                        
                    </li>
                </div>
            </div>
            {isLoading ? (
                <div className="flex h-screen">
                    <div className="m-auto">
                        <TailSpin color="#8200B1"></TailSpin>
                    </div>
                </div>
            ) : (
                <div>
                    {editModalSubmission && (
                        <div className="top-3 bottom-3 justify-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
                            <div className="top-0 w-5/6 h-11/12 border-0 rounded-md shadow-lg relative flex flex-col bg-[#dcadff] outline-none focus:outline-none">
                                <UserEditableSubmission 
                                    initialSubmission={editModalSubmission}
                                    issues={issues}
                                    onClose={async () => {
                                        await getSubmissions();

                                        dispatch({
                                            type: ActionType.ChangeEditModal,
                                            submission: undefined
                                        })
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    <div className="flex item-center justify-center overflow-auto mb-8">
                        {filteredSubmissions.length == 0 ? (
                            <div className="relative pt-20">
                                <div className="box-content border border-primary-blue relative w-full md:w-96 h-56 item-center left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                                <br></br>
                                <div className="text-primary-blue text-center relative left-1/2 bottom-1/12 transform -translate-x-1/2 -translate-y-1/8">
                                    You have no submissions
                                </div>
                            </div>
                        ) : (
                            <div className=" flex "> {/* mx-auto */}
                                <div className="grid gap-3 grid-cols-3 flex m-3 min-auto"> {/*  */}
                                    {filteredSubmissions.map(submission => {
                                        return (
                                            <SubmissionThumbnail
                                                key={submission.id}
                                                submission={submission}
                                                onClick={() => {
                                                    dispatch({
                                                        type: ActionType.ChangeEditModal,
                                                        submission: submission
                                                    });
                                                }}
                                            ></SubmissionThumbnail>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="p-1.5 ps-20 pe-20 flex justify-between items-center fixed bottom-0 w-full mr-8 text-primary-blue text-base text-sm lg:text-md">
                <div className="font-semibold">© 2024 BiWomenQuarterly</div>
                <div className="flex items-center">
                    <div className="mr-8">
                        <a href="https://www.biwomenquarterly.com/about/" target="_blank" rel="noopener noreferrer" className="text-base text-sm lg:text-md">About Us</a>
                    </div>
                </div>
            </div>
        </div>
        );
    }
}
